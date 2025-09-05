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
import { Point } from '../schemas/point.schema'
import { Social } from '../schemas/social.schema'

export interface RandomUsersAggregationResult {
  _id: null
  totalWeight: number
  users: Array<WeightedUser>
}

export interface WeightedUser {
  _id: Types.ObjectId
  weight: number
  accessToken: string
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Point.name) private pointModel: Model<Point>,
    @InjectModel(Social.name) private socialModel: Model<Social>,
    @InjectConnection() private connection: Connection,
  ) { }


  /**
   * 创建用户，同时报错一个refreshToken
   * @param createUserDto 
   * @returns 
   */
  async create(createUserDto: CreateUserDto): Promise<UserInfo> {
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
        walletAddress: createUserDto.walletAddress,
        chainId: createUserDto.chainId,
        lastSignedAt: createUserDto.lastSignedAt,
        name: createUserDto.walletAddress.slice(-6).toUpperCase(),
        isActive: true,
        preferences
      }

      const createdUser = new this.userModel(user)
      await createdUser.save()

      return createdUser.toJSON()
    } catch (error) {
      this.logger.error('创建用户失败', error)
      throw error
    }
  }

  async findById(id: string): Promise<UserInfo> {
    try {
      // 获取用户基本信息
      const user = await this.userModel.findById(id).exec()
      if (!user) {
        throw new NotFoundException(`User not found with id ${id}`)
      }

      // 在返回用户数据前排序匿名身份
      if (user.anonymousIdentities && user.anonymousIdentities.length > 0) {

        user.anonymousIdentities = user.anonymousIdentities.filter(
          identity => !identity.isDeleted
        )

        user.anonymousIdentities.sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      }

      // 使用 Promise.all 并行获取积分和社交数据
      const [points, socials] = await Promise.all([
        // 查询用户积分
        this.pointModel.findOne({ userId: id }).exec(),
        // 查询用户社交账号
        this.socialModel.find({ userId: id }).exec()
      ])

      // 构建并返回 UserInfo 对象
      return {
        ...user.toJSON(),
        socials: socials.map(s => {
          const { userId, ...social } = s.toJSON()
          return social
        }) || [],
        points: points ? (() => {
          const { userId, ...pointsData } = points.toJSON()
          return pointsData
        })() : { points: 0, count: 0 }
      }
    } catch (error) {
      this.logger.error('使用 ID 查找用户失败', error)
      throw error
    }
  }

  async findByWalletAddress(address: string, chainId: number): Promise<UserInfo> {
    try {
      const user = await this.userModel
        .findOne({ walletAddress: address }).exec()
      if (!user) {
        throw new NotFoundException(
          `User not found with wallet address ${address} and chainId ${chainId}`,
        )
      }

      // 在返回用户数据前排序匿名身份
      if (user.anonymousIdentities && user.anonymousIdentities.length > 0) {

        user.anonymousIdentities = user.anonymousIdentities.filter(
          identity => !identity.isDeleted
        )

        user.anonymousIdentities.sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      }

      // 使用 Promise.all 并行获取积分和社交数据
      const [points, socials] = await Promise.all([
        // 查询用户积分
        this.pointModel.findOne({ userId: user._id.toString() }).exec(),
        // 查询用户社交账号
        this.socialModel.find({ userId: user._id.toString() }).exec()
      ])

      // 构建并返回 UserInfo 对象
      return {
        ...user.toJSON(),
        socials: socials.map(s => {
          const { userId, ...social } = s.toJSON()
          return social
        }) || [],
        points: points ? (() => {
          const { userId, ...pointsData } = points.toJSON()
          return pointsData
        })() : { points: 0, count: 0 }
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

  async findContributors(excludedUserId: string, provider: SocialProvider, count: number): Promise<Contributor[]> {
    try {

      this.logger.log(`开始基于权重随机选择${provider}平台用户，排除用户ID: ${excludedUserId}`)

      // 确保将字符串ID转换为ObjectId进行比较
      const userObjectId = new Types.ObjectId(excludedUserId)

      // 使用聚合管道查询符合条件的用户
      // 1. 查找已有授权信息的用户
      // 2. 排除指定的用户ID
      // 3. 基于最后更新时间计算权重
      const pipeline: PipelineStage[] = [
        {
          $lookup: {
            from: 'socialauths', // SocialAuth 集合名称
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
                              { $ne: ['$refreshToken', ''] },
                              { $ne: ['$refreshToken', null] },
                              { $ifNull: ['$refreshToken', false] }
                            ]
                          },
                          else: {
                            $and: [
                              { $ne: ['$accessToken', ''] },
                              { $ne: ['$accessToken', null] },
                              { $ifNull: ['$accessToken', false] }
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
            _id: { $ne: userObjectId },
            'authInfo.0': { $exists: true }
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
                            { $arrayElemAt: ['$authInfo.lastUsedAt', 0] },
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
                weight: '$weight',
                accessToken: { $arrayElemAt: ['$authInfo.accessToken', 0] }
              }
            }
          }
        }
      ]

      const result = await this.userModel.aggregate(pipeline).exec()

      if (!result.length || result[0].totalWeight === 0) {
        this.logger.warn(`没有可用的${provider}平台用户或总权重为0`)
        throw new NotFoundException(`没有可用的${provider}平台用户或总权重为0`)
      }

      let { totalWeight, users } = result[0] as RandomUsersAggregationResult

      const contributors: Contributor[] = []
      while (contributors.length < count && users.length > 0) {
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
        contributors.push({ userId: selectedUser._id.toString(), accessToken: selectedUser.accessToken })

        users = users.filter(u => !u._id.equals(selectedUser!._id))
        // 更新 totalWeight，移除已选用户的权重
        totalWeight -= selectedUser.weight
      }

      if (contributors.length < count) {
        throw new NotFoundException(`Only found ${contributors.length} ${provider} platform users, less than requested ${count}`)
      } else {
        this.logger.log(`Successfully selected ${contributors.length} users: ${contributors.map(c => c.userId).join(', ')}`)
      }

      return contributors
    } catch (error) {
      this.logger.error(`Failed to prioritize select ${provider} platform users`, error)
      throw error
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserInfo> {
    try {
      // 如果更新包含匿名身份数据
      if (updateUserDto.anonymousIdentities && updateUserDto.anonymousIdentities.length > 0) {
        // 先获取当前用户数据，检查已有的匿名身份
        const currentUser = await this.userModel.findById(id).exec()
        if (!currentUser) {
          throw new NotFoundException(`User not found with id ${id}`)
        }

        // 1. 检查提交的匿名身份中是否有多个活跃状态
        const activeSubmittedIdentities = updateUserDto.anonymousIdentities.filter(identity => identity.isActive)
        if (activeSubmittedIdentities.length > 1) {
          throw new BadRequestException('只能有一个匿名身份处于活跃状态')
        }

        // 2. 创建一个映射，用于合并和处理所有匿名身份
        const identityMap = new Map()

        // 3. 先添加提交中的所有身份到映射
        updateUserDto.anonymousIdentities.forEach(identity => {
          let dateData = {}
          if (!identity.id) {
            identity.id = randomUUID()
            dateData = {
              createdAt: new Date(),
              updatedAt: new Date()
            }
          }
          identityMap.set(identity.id, { ...identity, ...dateData })
        })


        // 4. 处理当前用户的匿名身份，并合并到映射中
        for (const currentIdentity of currentUser.anonymousIdentities ?? []) {

          if (!identityMap.has(currentIdentity.id)) {
            if (activeSubmittedIdentities.length > 0 && currentIdentity.isActive) {
              currentIdentity.isActive = false
            }
            identityMap.set(currentIdentity.id, { ...currentIdentity })
          } else {
            const identity = identityMap.get(currentIdentity.id)
            identityMap.set(currentIdentity.id, { ...currentIdentity, ...identity, updatedAt: new Date() })
          }

        }

        // 5. 更新DTO中的匿名身份数据
        updateUserDto.anonymousIdentities = Array.from(identityMap.values())
      }

      const flattenedUpdate = this.flattenObject(updateUserDto)

      // 先更新用户数据
      const updatedUser = await this.userModel
        .findByIdAndUpdate(
          id,
          { $set: flattenedUpdate },
          { new: true }
        )
        .exec()

      if (!updatedUser) {
        throw new NotFoundException(`User not found with id ${id}`)
      }

      // 在应用层面过滤已删除的匿名身份
      if (updatedUser.anonymousIdentities && updatedUser.anonymousIdentities.length > 0) {
        updatedUser.anonymousIdentities = updatedUser.anonymousIdentities.filter(
          identity => !identity.isDeleted
        )

        // 排序匿名身份
        updatedUser.anonymousIdentities.sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      }

      return updatedUser
    } catch (error) {
      this.logger.error('更新用户失败', error)
      throw error
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
