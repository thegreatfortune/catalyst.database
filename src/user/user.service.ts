import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import {
  User,
  SocialAccount,
  Metrics,
  SocialAccountTokenState,
  SocialAccountMiningState,
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
import { UpdateSocialAccountDto } from './dto/update-social-account.dto'
import {
  SocialAccountAddDto,
  SocialAccountTokenStateAddDto,
} from './dto/add-social-account.dto'

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(@InjectModel(User.name) private userModel: Model<User>) { }


  /**
   * 创建用户，同时报错一个refreshToken
   * @param createUserDto 
   * @returns 
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
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
      return await createdUser.save()
    } catch (error) {
      this.logger.error('创建用户失败', error)
      throw error
    }
  }

  async findById(id: string): Promise<User> {
    try {
      const user = await this.userModel.findById(id).exec()
      if (!user) {
        throw new NotFoundException(`User not found with id ${id}`)
      }
      return user
    } catch (error) {
      this.logger.error('使用 ID 查找用户失败', error)
      throw error
    }
  }

  async findByWalletAddress(address: string): Promise<User> {
    try {
      const user = await this.userModel
        .findOne({ walletAddress: address }).exec()
      if (!user) {
        throw new NotFoundException(
          `User not found with wallet address ${address}`,
        )
      }
      return user
    } catch (error) {
      this.logger.error('使用 wallet address 查找用户失败', error)
      throw error
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      const flattenedUpdate = this.flattenObject(updateUserDto)

      const user = await this.userModel
        .findByIdAndUpdate(
          id,
          { $set: flattenedUpdate },
          { new: true }
        )
        .exec()

      if (!user) {
        throw new NotFoundException(`User not found with id ${id}`)
      }
      return user
    } catch (error) {
      this.logger.error('更新用户失败', error)
      throw error
    }
  }


  async remove(id: string): Promise<User> {
    try {
      const user = await this.userModel.findByIdAndDelete(id).exec()
      if (!user) {
        throw new NotFoundException(`User not found with id ${id}`)
      }
      return user
    } catch (error) {
      this.logger.error('删除用户失败', error)
      throw error
    }
  }

  async findUsersByChainType(chainType: string): Promise<User[]> {
    try {
      return this.userModel.find({ chainType }).exec()
    } catch (error) {
      this.logger.error('使用 Chain Type 查询用户失败', error)
      throw error
    }
  }

  async addSocialAccount(
    userId: string,
    socialProvider: SocialProvider,
    socialAccountDto: SocialAccountAddDto,
    socialAccountTokenStateDto: SocialAccountTokenStateAddDto,
  ): Promise<User> {
    try {
      const user = await this.userModel.findById(userId).exec()

      if (!user) {
        throw new NotFoundException('用户不存在')
      }

      if (
        !user.socialAccounts ||
        !user.socialAccountTokenStates ||
        !user.socialAccountMiningStates
      ) {
        user.socialAccounts = []
        user.socialAccountTokenStates = []
        user.socialAccountMiningStates = []
      }

      const existingAccountIndex = user.socialAccounts.findIndex(
        (account) => account.provider === socialProvider,
      )

      if (existingAccountIndex === -1) {
        const metrics: Metrics = {
          followers: socialAccountDto.metrics.followers,
          following: socialAccountDto.metrics.following,
          totalPosts: socialAccountDto.metrics.totalPosts,
        }
        const socialAccount: SocialAccount = {
          provider: socialProvider,
          accountId: socialAccountDto.accountId,
          username: socialAccountDto.username,
          displayName: socialAccountDto.displayName,
          profileUrl: socialAccountDto.profileUrl,
          metrics: metrics,
          lastSyncedAt: socialAccountDto.lastSyncedAt,
          isConnected: socialAccountDto.isConnected,
        }

        const socialAccountTokenState: SocialAccountTokenState = {
          provider: socialProvider,
          accessToken: socialAccountTokenStateDto.accessToken,
          refreshToken: socialAccountTokenStateDto.refreshToken,
          tokenExpiry: socialAccountTokenStateDto.tokenExpiry,
          scope: socialAccountTokenStateDto.scope,
        }

        const socialAccountMiningState: SocialAccountMiningState = {
          provider: socialProvider,
          points: 0,
          count: 0,
        }

        user.socialAccounts.push(socialAccount)
        user.socialAccountTokenStates.push(socialAccountTokenState)
        user.socialAccountMiningStates.push(socialAccountMiningState)
      } else {
        throw new BadRequestException('用户已绑定该社交账号')
      }

      return user.save()
    } catch (error) {
      this.logger.error('添加用户 Social Account 失败', error)
      throw error
    }
  }

  async removeSocialAccount(userId: string, socialProvider: SocialProvider): Promise<User> {
    try {
      const user = await this.userModel.findById(userId).exec()

      if (!user) {
        throw new NotFoundException('用户不存在')
      }

      if (!user.socialAccounts) {
        throw new NotFoundException(`未找到绑定的${socialProvider}账号`)
      }

      const initialLength = user.socialAccounts.length
      user.socialAccounts = user.socialAccounts.filter(
        (account) => account.provider !== socialProvider,
      )

      if (user.socialAccounts.length === initialLength) {
        throw new NotFoundException(`未找到绑定的${socialProvider}账号`)
      }

      return user.save()
    } catch (error) {
      this.logger.error('删除用户 Social Account 失败', error)
      throw error
    }
  }

  async findUserBySocialAccount(
    socialProvider: SocialProvider,
    accountId: string,
  ): Promise<User> {
    try {
      const user = await this.userModel
        .findOne({
          socialAccounts: {
            $elemMatch: {
              provider: socialProvider,
              accountId,
            },
          },
        })
        .exec()
      if (!user) {
        throw new NotFoundException(
          `User not found with social account ${socialProvider}:${accountId}`,
        )
      }
      return user
    } catch (error) {
      this.logger.error('使用 Social Account 查找用户失败', error)
      throw error
    }
  }

  async updateSocialAccount(
    userId: string,
    socialProvider: SocialProvider,
    updateData: UpdateSocialAccountDto,
  ): Promise<User> {
    try {
      const user = await this.userModel.findById(userId).exec()

      if (!user) {
        throw new NotFoundException('用户不存在')
      }

      if (
        !user.socialAccounts ||
        !user.socialAccountTokenStates ||
        !user.socialAccountMiningStates
      ) {
        throw new NotFoundException(`未找到绑定的${socialProvider}账号`)
      }

      const accountIndex = user.socialAccounts.findIndex(
        (account) => account.provider === socialProvider,
      )

      const tokenStateIndex = user.socialAccountTokenStates.findIndex(
        (tokenState) => tokenState.provider === socialProvider,
      )

      const miningStateIndex = user.socialAccountMiningStates.findIndex(
        (miningState) => miningState.provider === socialProvider,
      )

      if (updateData.socialAccount) {
        if (accountIndex === -1) {
          throw new NotFoundException(`未找到绑定的${socialProvider}账号`)
        }
        user.socialAccounts[accountIndex] = {
          ...user.socialAccounts[accountIndex],
          ...updateData.socialAccount,
        }

        if (updateData.socialAccount.metrics) {
          user.socialAccounts[accountIndex].metrics = {
            ...user.socialAccounts[accountIndex].metrics,
            ...updateData.socialAccount.metrics,
          }
        }
      }

      if (updateData.socialAccountTokenState) {
        if (tokenStateIndex === -1) {
          throw new NotFoundException(`未找到绑定的${socialProvider}账号`)
        }
        user.socialAccountTokenStates[tokenStateIndex] = {
          ...user.socialAccountTokenStates[tokenStateIndex],
          ...updateData.socialAccountTokenState,
        }
      }

      if (updateData.socialAccountMiningState) {
        if (miningStateIndex === -1) {
          throw new NotFoundException(`未找到绑定的${socialProvider}账号`)
        }
        user.socialAccountMiningStates[miningStateIndex] = {
          ...user.socialAccountMiningStates[miningStateIndex],
          ...updateData.socialAccountMiningState,
        }
      }

      return user.save()
    } catch (error) {
      this.logger.error('更新用户社交账号失败', error)
      throw error
    }
  }

  async findRandomUserIdWithToken(
    provider: SocialProvider,
  ): Promise<string> {
    try {
      this.logger.log(`开始基于权重随机选择${provider}平台用户`)

      const matchCondition = {
        socialAccounts: {
          $elemMatch: {
            provider,
            isConnected: true,
          },
        },
        socialAccountTokenStates: {
          $elemMatch: {
            provider,
            ...(provider === SocialProvider.X
              ? { refreshToken: { $exists: true, $ne: '' } }
              : { accessToken: { $exists: true, $ne: '' } }),
          },
        },
      }

      const totalWeightResult = await this.userModel
        .aggregate([
          { $match: matchCondition },
          { $unwind: '$socialAccountTokenStates' },
          { $match: { 'socialAccountTokenStates.provider': provider } },
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
                              '$socialAccountTokenStates.lastUsedAt',
                              new Date(0), // 如果lastUsedAt不存在，使用1970年
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
            $group: {
              _id: null,
              totalWeight: { $sum: '$weight' },
            },
          },
        ])
        .exec()

      const totalWeight = totalWeightResult[0]?.totalWeight || 0
      if (totalWeight === 0) {
        this.logger.warn(`没有可用的${provider}平台用户或总权重为0`)
        throw new NotFoundException(`没有可用的${provider}平台用户或总权重为0`)
      }

      const randomNumber = Math.random() * totalWeight
      this.logger.debug(`总权重: ${totalWeight}, 随机数: ${randomNumber}`)

      const randomUsers = await this.userModel
        .aggregate([
          { $match: matchCondition },
          { $unwind: '$socialAccountTokenStates' },
          { $match: { 'socialAccountTokenStates.provider': provider } },
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
                              '$socialAccountTokenStates.lastUsedAt',
                              new Date(0),
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
          { $sort: { _id: 1 } },
          {
            $setWindowFields: {
              partitionBy: null,
              sortBy: { _id: 1 },
              output: {
                cumulativeWeight: {
                  $sum: '$weight',
                  window: { documents: ['unbounded', 'current'] },
                },
              },
            },
          },
          { $match: { cumulativeWeight: { $gte: randomNumber } } },
          { $limit: 1 },
          {
            $project: {
              _id: 1,
            },
          },
        ])
        .exec()

      if (randomUsers && randomUsers.length > 0) {
        this.logger.log(`成功选择用户ID: ${randomUsers[0]._id}`)
        return randomUsers[0]._id
      }

      this.logger.warn(`未能找到符合条件的${provider}平台用户`)
      throw new NotFoundException(`未能找到符合条件的${provider}平台用户`)
    } catch (error) {
      this.logger.error(`加权随机选择${provider}平台用户失败`, error)
      throw error
    }
  }

  async updateSocialAccountLastUsedAt(
    userId: string,
    provider: SocialProvider,
  ): Promise<User> {
    try {
      this.logger.log(`更新用户 ${userId} 的 ${provider} 账号最后使用时间`)

      const result = await this.userModel
        .findOneAndUpdate(
          {
            _id: userId,
            'socialAccountTokenStates.provider': provider,
          },
          {
            $set: {
              'socialAccountTokenStates.$.lastUsedAt': new Date(),
            },
          },
          { new: true },
        )
        .exec()

      if (!result) {
        throw new NotFoundException(
          `未找到用户 ${userId} 或其 ${provider} 账号`,
        )
      }

      return result
    } catch (error) {
      this.logger.error(
        `更新用户 ${userId} 的 ${provider} 账号最后使用时间失败`,
        error,
      )
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
