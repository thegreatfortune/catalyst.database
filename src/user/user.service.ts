import {
  Injectable,
  NotFoundException,
  BadRequestException
} from '@nestjs/common'
import { InjectConnection, InjectModel } from '@nestjs/mongoose'
import { Connection, Model } from 'mongoose'
import {
  User,
  Preferences,
  SocialProvider,
  Language,
  Theme,
  DefaultCurrency,
  Timezone,
} from '../schemas/user.schema'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { Logger } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { Types, PipelineStage } from 'mongoose'
import { Contributor, UserInfo } from './dto/reponse.dto'
import { Credit } from '../schemas/credit.schema'
import { Social, SocialDocument } from '../schemas/social.schema'
import { CreditService } from '../credit/credit.service'
import { SocialService } from '../social/social.service'
import { LoginUserDto } from './dto/login-user.dto'
import { AnonymousIdentity, AnonymousIdentityDocument } from 'src/schemas/anonymout-identity.schema'
import { RedisService } from '../redis/redis.service'
import { GetContributorDto } from './dto/get-contributor.dto'
import { FundsService } from '../funds/funds.service'
import { Funds } from '../schemas/funds.schema'

export interface RandomUsersAggregationResult {
  _id: null
  totalWeight: number
  users: Array<WeightedUser>
}

export interface WeightedUser {
  _id: Types.ObjectId
  weight: number
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly RATE_LIMIT_PREFIX = 'rate_limit:contributor:';
  private readonly DEFAULT_EXPIRY = 15 * 60; // 15分钟过期时间（秒）
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Credit.name) private creditModel: Model<Credit>,
    @InjectModel(Social.name) private socialModel: Model<Social>,
    @InjectModel(Funds.name) private fundsModel: Model<Funds>,
    @InjectModel(AnonymousIdentity.name) private anonymousIdentityModel: Model<AnonymousIdentity>,
    @InjectConnection() private connection: Connection,
    private readonly fundsService: FundsService,
    private readonly creditService: CreditService,
    private readonly redisService: RedisService,
  ) { }


  /**
   * 创建用户，同时报错一个refreshToken
   * @param cuDto 
   * @returns 
   */
  async create(cuDto: CreateUserDto): Promise<UserInfo> {
    const session = await this.connection.startSession()
    session.startTransaction()
    try {

      const preferences: Preferences = {
        ui: {
          language: Language.zhCN,
          theme: Theme.light,
          defaultCurrency: DefaultCurrency.USDT,
          timezone: Timezone['Asia/Shanghai']
        },
        ai: {
          enabled: true
        },
        anonymous: {
          enabled: true
        }
      }
      const user = {
        walletAddress: cuDto.walletAddress,
        chainId: cuDto.chainId,
        lastSignedAt: cuDto.lastSignedAt,
        name: cuDto.walletAddress.slice(-6).toUpperCase(),
        isActive: true,
        preferences
      }

      const createdUser = new this.userModel(user)
      await createdUser.save({ session })

      await this.fundsService.create(createdUser._id.toString(), cuDto.walletAddress, session)
      await this.creditService.create(createdUser._id.toString(), session)

      await session.commitTransaction()

      return createdUser.toJSON()
    } catch (error) {
      await session.abortTransaction()
      this.logger.error('创建用户失败', error)
      throw error
    } finally {
      await session.endSession()
    }
  }

  async login(luDto: LoginUserDto): Promise<UserInfo> {
    const { walletAddress, chainId, issuedAt } = luDto
    try {
      // 先更新用户数据
      const updatedUser = await this.userModel
        .findOneAndUpdate(
          { walletAddress, chainId },
          { $set: { lastSignedAt: issuedAt } },
          { new: true }
        )
        .exec()

      if (!updatedUser) {
        throw new NotFoundException(`User not found with walletAddress ${walletAddress} and chainId ${chainId}`)
      }
      // 使用聚合管道一次性获取用户及其关联数据
      const aggregationResult = await this.userModel.aggregate([
        { $match: { _id: updatedUser._id } },
        {
          $lookup: {
            from: 'credits',
            localField: '_id',
            foreignField: 'userId',
            as: 'creditData'
          }
        },
        {
          $lookup: {
            from: 'funds',
            localField: '_id',
            foreignField: 'userId',
            as: 'fundsData'
          }
        },
        {
          $lookup: {
            from: 'socials',
            localField: '_id',
            foreignField: 'userId',
            as: 'socialsData'
          }
        },
        {
          $lookup: {
            from: 'anonymous_identities',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$userId', '$$userId'] },
                  isDeleted: false  // 直接在聚合查询中过滤掉已删除的身份
                }
              },
              { $sort: { createdAt: -1 } }  // 按创建时间降序排序
            ],
            as: 'anonymousIdentitiesData'
          }
        },
        {
          $project: {
            creditData: 1,
            fundsData: 1,
            socialsData: 1,
            anonymousIdentitiesData: 1,
            _id: 0
          }
        }
      ]).exec()

      if (!aggregationResult || aggregationResult.length === 0) {
        throw new NotFoundException(`User not found with walletAddress ${walletAddress} and chainId ${chainId}`)
      }

      const creditData = aggregationResult[0].creditData
      const fundsData = aggregationResult[0].fundsData
      const socialsData = aggregationResult[0].socialsData
      const anonymousIdentitiesData = aggregationResult[0].anonymousIdentitiesData

      const credit = creditData && creditData.length > 0
        ? this.creditModel.hydrate(creditData[0])
        : new this.creditModel({
          balance: 0,
          totalAcquired: 0,
          totalConsumed: 0,
          acquiredCount: 0,
          consumedCount: 0,
          freePosts: []
        })

      const funds = fundsData && fundsData.length > 0
        ? this.fundsModel.hydrate(fundsData[0])
        : new this.fundsModel({
          balance: 0,
          totalAcquired: 0,
          totalConsumed: 0,
          acquiredCount: 0,
          consumedCount: 0,
        })

      const socials: SocialDocument[] = []
      if (socialsData && socialsData.length > 0) {
        for (const socialData of socialsData) {
          socials.push(this.socialModel.hydrate(socialData))
        }
      }

      const anonymousIdentities: AnonymousIdentityDocument[] = []
      if (anonymousIdentitiesData && anonymousIdentitiesData.length > 0) {
        for (const identityData of anonymousIdentitiesData) {
          anonymousIdentities.push(this.anonymousIdentityModel.hydrate(identityData))
        }
      }

      // 构建并返回 UserInfo 对象
      return {
        ...updatedUser.toJSON(),
        credit: credit.toJSON(),
        funds: funds.toJSON(),
        socials: socials.map(social => social.toJSON()),
        anonymousIdentities: anonymousIdentities.map(identity => identity.toJSON()),
      }
    } catch (error) {
      this.logger.error('用户登录失败', error)
      throw error
    }
  }

  async findById(id: string): Promise<UserInfo> {
    try {
      const aggregationResult = await this.userModel.aggregate([
        { $match: { _id: new Types.ObjectId(id) } },
        {
          $lookup: {
            from: 'credits',
            localField: '_id',
            foreignField: 'userId',
            as: 'creditData'
          }
        },
        {
          $lookup: {
            from: 'socials',
            localField: '_id',
            foreignField: 'userId',
            as: 'socialsData'
          }
        },
        {
          $lookup: {
            from: 'anonymous_identities',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$userId', '$$userId'] },
                  isDeleted: false  // 直接在聚合查询中过滤掉已删除的身份
                }
              },
              { $sort: { createdAt: -1 } }  // 按创建时间降序排序
            ],
            as: 'anonymousIdentitiesData'
          }
        },
      ]).exec()

      if (!aggregationResult || aggregationResult.length === 0) {
        throw new NotFoundException(`User not found with id ${id}`)
      }

      const creditData = aggregationResult[0].creditData
      const socialsData = aggregationResult[0].socialsData
      const anonymousIdentitiesData = aggregationResult[0].anonymousIdentitiesData

      const credit = creditData && creditData.length > 0
        ? this.creditModel.hydrate(creditData[0])
        : new this.creditModel({
          balance: 0,
          acquiredCount: 0,
          consumedCount: 0,
          freePosts: []
        })

      const socials: SocialDocument[] = []
      if (socialsData && socialsData.length > 0) {
        for (const socialData of socialsData) {
          socials.push(this.socialModel.hydrate(socialData))
        }
      }

      const anonymousIdentities: AnonymousIdentityDocument[] = []
      if (anonymousIdentitiesData && anonymousIdentitiesData.length > 0) {
        for (const identityData of anonymousIdentitiesData) {
          anonymousIdentities.push(this.anonymousIdentityModel.hydrate(identityData))
        }
      }

      delete aggregationResult[0].creditData
      delete aggregationResult[0].socialsData
      delete aggregationResult[0].anonymousIdentitiesData
      const user = this.userModel.hydrate(aggregationResult[0])

      // 构建并返回 UserInfo 对象
      return {
        ...user.toJSON(),
        credit: credit.toJSON(),
        socials: socials.map(social => social.toJSON()),
        anonymousIdentities: anonymousIdentities.map(identity => identity.toJSON()),
      }
    } catch (error) {
      this.logger.error('使用 ID 查找用户失败', error)
      throw error
    }
  }

  async findByWalletAddress(walletAddress: string, chainId: number): Promise<UserInfo> {
    try {
      const aggregationResult = await this.userModel.aggregate([
        { $match: { walletAddress, chainId } },
        {
          $lookup: {
            from: 'credits',
            localField: '_id',
            foreignField: 'userId',
            as: 'creditData'
          }
        },
        {
          $lookup: {
            from: 'socials',
            localField: '_id',
            foreignField: 'userId',
            as: 'socialsData'
          }
        },
        {
          $lookup: {
            from: 'anonymous_identities',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$userId', '$$userId'] },
                  isDeleted: false  // 直接在聚合查询中过滤掉已删除的身份
                }
              },
              { $sort: { createdAt: -1 } }  // 按创建时间降序排序
            ],
            as: 'anonymousIdentitiesData'
          }
        },
      ]).exec()

      if (!aggregationResult || aggregationResult.length === 0) {
        throw new NotFoundException(`User not found with walletAddress ${walletAddress} and chainId ${chainId}`)
      }

      const creditData = aggregationResult[0].creditData
      const socialsData = aggregationResult[0].socialsData
      const anonymousIdentitiesData = aggregationResult[0].anonymousIdentitiesData

      const credit = creditData && creditData.length > 0
        ? this.creditModel.hydrate(creditData[0])
        : new this.creditModel({
          balance: 0,
          acquiredCount: 0,
          consumedCount: 0,
          freePosts: []
        })

      const socials: SocialDocument[] = []
      if (socialsData && socialsData.length > 0) {
        for (const socialData of socialsData) {
          socials.push(this.socialModel.hydrate(socialData))
        }
      }

      const anonymousIdentities: AnonymousIdentityDocument[] = []
      if (anonymousIdentitiesData && anonymousIdentitiesData.length > 0) {
        for (const identityData of anonymousIdentitiesData) {
          anonymousIdentities.push(this.anonymousIdentityModel.hydrate(identityData))
        }
      }

      delete aggregationResult[0].creditData
      delete aggregationResult[0].socialsData
      delete aggregationResult[0].anonymousIdentitiesData
      const user = this.userModel.hydrate(aggregationResult[0])

      // 构建并返回 UserInfo 对象
      return {
        ...user.toJSON(),
        credit: credit.toJSON(),
        socials: socials.map(social => social.toJSON()),
        anonymousIdentities: anonymousIdentities.map(identity => identity.toJSON()),
      }

    } catch (error) {
      this.logger.error('使用 wallet address 查找用户失败', error)
      throw error
    }
  }

  async findUsersByChainType(chainType: string): Promise<UserInfo[]> {
    try {
      return this.userModel.find({ chainType }).exec()
    } catch (error) {
      this.logger.error('使用 Chain Type 查询用户失败', error)
      throw error
    }
  }

  async getContributorIds(gcDto: GetContributorDto): Promise<string[]> {
    const { excludedUserId, provider, count, toExcludedContributorIds } = gcDto
    try {
      this.logger.log(`开始基于权重随机选择${provider}平台用户，排除用户ID: ${excludedUserId}, 排除贡献者ID: ${toExcludedContributorIds}`)

      // 1. 从 Redis 获取已被速率限制的贡献者ID
      const excludedContributors = await this.getExcludedContributors()

      // 2. 合并所有需要排除的ID
      const allExcludedIds = [excludedUserId, ...excludedContributors]

      // 添加传入的排除列表
      if (toExcludedContributorIds && toExcludedContributorIds.length > 0) {
        // 将传入的排除列表添加到 Redis 中，设置过期时间
        await this.addExcludedContributors(toExcludedContributorIds)
        allExcludedIds.push(...toExcludedContributorIds)
      }

      // 去重
      const uniqueExcludedIds = [...new Set(allExcludedIds)]

      this.logger.log(`合并后的排除ID列表: ${uniqueExcludedIds.join(', ')}`)

      // 确保将字符串ID转换为ObjectId进行比较
      const excludedObjectIds = uniqueExcludedIds.map(id => {
        try {
          return new Types.ObjectId(id)
        } catch (e) {
          this.logger.warn(`Invalid ObjectId: ${id}`)
          return null
        }
      }).filter(id => id !== null)

      // 使用聚合管道查询符合条件的用户
      // 1. 查找已有授权信息的用户
      // 2. 排除指定的用户ID列表
      // 3. 基于最后更新时间计算权重
      const pipeline: PipelineStage[] = [
        {
          $lookup: {
            from: 'social_auths', // SocialAuth 集合名称
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$userId', '$$userId'] },
                      { $eq: ['$provider', provider] },
                      {
                        $cond: {
                          if: { $eq: ['$provider', SocialProvider.X] },
                          then: {
                            $and: [
                              { $ne: ['$details.refreshToken', ''] },
                              { $ne: ['$details.refreshToken', null] },
                              { $ifNull: ['$details.refreshToken', false] }
                            ]
                          },
                          else: {
                            $and: [
                              { $ne: ['$details.accessToken', ''] },
                              { $ne: ['$details.accessToken', null] },
                              { $ifNull: ['$details.accessToken', false] }
                            ]
                          }
                        }
                      }
                    ]
                  }
                }
              }
            ],
            as: 'authInfo'
          }
        },
        {
          $match: {
            _id: { $nin: excludedObjectIds }, // 使用 $nin 排除所有指定的ID
            'authInfo.0': { $exists: true }
          }
        },
        {
          $addFields: {
            authInfo: { $arrayElemAt: ['$authInfo', 0] }
          }
        },
        {
          $addFields: {
            weight: {
              $max: [
                1,
                {
                  $divide: [
                    {
                      $subtract: [
                        new Date(),
                        {
                          $ifNull: [
                            '$authInfo.lastUsedAt',
                            new Date(0), // 如果updatedAt不存在，使用1970年
                          ],
                        },
                      ],
                    },
                    1000 * 60, // 转换为分钟
                  ],
                },
              ],
            },
          },
        },
        {
          $sort: { weight: -1 }
        },
        {
          $limit: 500
        },
        {
          $group: {
            _id: null,
            totalWeight: { $sum: '$weight' },
            users: {
              $push: {
                _id: '$_id',
                weight: '$weight'
              }
            }
          }
        }
      ]

      const result = await this.userModel.aggregate(pipeline).exec()
      console.log('getContributors 查询结果', result)

      if (!result.length || result[0].totalWeight === 0) {
        this.logger.warn(`没有可用的${provider}平台用户或总权重为0`)
        throw new NotFoundException(`没有可用的${provider}平台用户或总权重为0`)
      }

      let { totalWeight, users } = result[0] as RandomUsersAggregationResult

      const contributorIds: string[] = []
      while (contributorIds.length < count && users.length > 0) {
        const randomNumber = Math.random() * totalWeight

        let cumulativeWeight = 0
        let selectedUser: WeightedUser | null = null

        for (const user of users) {
          cumulativeWeight += user.weight
          if (cumulativeWeight >= randomNumber) {
            selectedUser = user
            break
          }
        }

        if (!selectedUser) break

        // 将选中的用户添加到结果，并从 users 中移除以避免重复
        contributorIds.push(selectedUser._id.toString())

        users = users.filter(u => !u._id.equals(selectedUser!._id))
        // 更新 totalWeight，移除已选用户的权重
        totalWeight -= selectedUser.weight
      }

      if (contributorIds.length < count) {
        throw new NotFoundException(`Only found ${contributorIds.length} ${provider} platform users, less than requested ${count}`)
      } else {
        this.logger.log(`Successfully selected ${contributorIds.length} users: ${contributorIds.join(', ')}`)
      }

      // 关键改动：选择完成后，立即将这些ID添加到Redis中，使用较短的TTL
      if (contributorIds.length > 0) {
        await this.addExcludedContributors(contributorIds, 30) // 30秒的短期排除
      }

      return contributorIds
    } catch (error) {
      this.logger.error(`Failed to prioritize select ${provider} platform users`, error)
      throw error
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserInfo> {
    try {
      // 先更新用户数据
      const updatedUser = await this.userModel
        .findByIdAndUpdate(
          id,
          { $set: { ...updateUserDto } },
          { new: true }
        )
        .exec()

      if (!updatedUser) {
        throw new NotFoundException(`User not found with id ${id}`)
      }

      const aggregationResult = await this.userModel.aggregate([
        { $match: { _id: updatedUser._id } },
        {
          $lookup: {
            from: 'credits',
            localField: '_id',
            foreignField: 'userId',
            as: 'creditData'
          }
        },
        {
          $lookup: {
            from: 'socials',
            localField: '_id',
            foreignField: 'userId',
            as: 'socialsData'
          }
        },
        {
          $lookup: {
            from: 'anonymous_identities',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$userId', '$$userId'] },
                  isDeleted: false  // 直接在聚合查询中过滤掉已删除的身份
                }
              },
              { $sort: { createdAt: -1 } }  // 按创建时间降序排序
            ],
            as: 'anonymousIdentitiesData'
          }
        },
        {
          $project: {
            creditData: 1,
            socialsData: 1,
            anonymousIdentitiesData: 1,
            _id: 0
          }
        }
      ]).exec()

      if (!aggregationResult || aggregationResult.length === 0) {
        throw new NotFoundException(`User not found with id ${id}`)
      }

      const creditData = aggregationResult[0].creditData
      const socialsData = aggregationResult[0].socialsData
      const anonymousIdentitiesData = aggregationResult[0].anonymousIdentitiesData

      const credit = creditData && creditData.length > 0
        ? this.creditModel.hydrate(creditData[0])
        : new this.creditModel({
          balance: 0,
          acquiredCount: 0,
          consumedCount: 0,
          freePosts: []
        })

      const socials: SocialDocument[] = []
      if (socialsData && socialsData.length > 0) {
        for (const socialData of socialsData) {
          socials.push(this.socialModel.hydrate(socialData))
        }
      }

      const anonymousIdentities: AnonymousIdentityDocument[] = []
      if (anonymousIdentitiesData && anonymousIdentitiesData.length > 0) {
        for (const identityData of anonymousIdentitiesData) {
          anonymousIdentities.push(this.anonymousIdentityModel.hydrate(identityData))
        }
      }

      // 构建并返回 UserInfo 对象
      return {
        ...updatedUser.toJSON(),
        credit: credit.toJSON(),
        socials: socials.map(social => social.toJSON()),
        anonymousIdentities: anonymousIdentities.map(identity => identity.toJSON()),
      }
    } catch (error) {
      this.logger.error('更新用户失败', error)
      throw error
    }
  }

  /**
   * 将贡献者ID添加到速率限制黑名单
   * @param contributorIds 贡献者ID数组
   * @param ttl 过期时间（秒），默认15分钟
   */
  private async addExcludedContributors(contributorIds: string[], ttl: number = this.DEFAULT_EXPIRY): Promise<void> {
    // 构建键值对数组
    const items = contributorIds.map(contributorId => ({
      key: `${this.RATE_LIMIT_PREFIX}${contributorId}`,
      value: Date.now(),
      ttl
    }))

    // 使用 mset 批量设置
    await this.redisService.mset(items)

    this.logger.log(`已将贡献者 ${contributorIds.join(', ')} 添加到速率限制黑名单，持续 ${ttl} 秒`)
  }

  /**
   * 获取所有速率限制的贡献者ID
   * @returns 贡献者ID数组
   */
  private async getExcludedContributors(): Promise<string[]> {
    try {
      // 使用 keys 命令获取所有匹配的键
      const keys = await this.redisService.keys(`${this.RATE_LIMIT_PREFIX}*`)

      // 从键中提取贡献者ID
      return keys.map(key => key.substring(this.RATE_LIMIT_PREFIX.length))
    } catch (error) {
      this.logger.error('获取速率限制贡献者列表失败', error)
      return []
    }
  }

  private flattenObject(obj: Record<string, any>, prefix = ''): Record<string, any> {
    const flattened: Record<string, any> = {}

    Object.keys(obj).forEach((key) => {
      const value = obj[key]
      const newKey = prefix ? `${prefix}${key}` : key

      if (
        value != null &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        !(value instanceof Date) &&
        !(value instanceof Buffer)
      ) {
        Object.assign(flattened, this.flattenObject(value, `${newKey}.`))
      } else if (value !== undefined) {
        flattened[newKey] = value
      }
    })

    return flattened
  }
}
