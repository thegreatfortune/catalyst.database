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
      const user = {
        walletAddress: createUserDto.walletAddress,
        chainType: createUserDto.chainType,
        lastSignedAt: createUserDto.lastSignedAt,
        displayName: createUserDto.walletAddress, // TODO: displayName 获取钱包尾号
        isActive: createUserDto.isActive,
        walletInfo: createUserDto.walletInfo,
        preferences: createUserDto.preferences, // TODO 修改成default preferences
      }

      const createdUser = new this.userModel(user)
      return createdUser.save()
    } catch (error) {
      this.logger.error('创建用户失败', error)
      throw error
    }
  }

  async findAll(): Promise<User[]> {
    try {
      return this.userModel.find().exec()
    } catch (error) {
      this.logger.error('查询用户失败', error)
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
        .findOne({ 'walletAddress': address })
        .exec()
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
      const user = await this.userModel
        .findByIdAndUpdate(id, updateUserDto, { new: true })
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
      return this.userModel.find({ 'wallets.chainType': chainType }).exec()
    } catch (error) {
      this.logger.error('使用 Chain Type 查询用户失败', error)
      throw error
    }
  }

  // 社交账号相关方法
  async addSocialAccount(
    userId: string,
    platform: 'twitter' | 'instagram' | 'rednote' | 'facebook',
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

      // 检查是否已存在相同平台的社交账号
      const existingAccountIndex = user.socialAccounts.findIndex(
        (account) => account.platform === platform,
      )

      if (existingAccountIndex === -1) {
        const metrics: Metrics = {
          followers: socialAccountDto.metrics.followers,
          following: socialAccountDto.metrics.following,
          totalPosts: socialAccountDto.metrics.totalPosts,
        }
        const socialAccount: SocialAccount = {
          platform,
          accountId: socialAccountDto.accountId,
          username: socialAccountDto.username,
          displayName: socialAccountDto.displayName,
          profileUrl: socialAccountDto.profileUrl,
          metrics: metrics,
          lastSyncedAt: socialAccountDto.lastSyncedAt,
          isConnected: socialAccountDto.isConnected,
        }

        const socialAccountTokenState: SocialAccountTokenState = {
          platform,
          accessToken: socialAccountTokenStateDto.accessToken,
          refreshToken: socialAccountTokenStateDto.refreshToken,
          tokenExpiry: socialAccountTokenStateDto.tokenExpiry,
          scope: socialAccountTokenStateDto.scope,
        }

        const socialAccountMiningState: SocialAccountMiningState = {
          platform,
          points: 0,
          count: 0,
        }

        // 添加新社交账号
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

  // TODO 移除只做逻辑删除
  async removeSocialAccount(userId: string, platform: string): Promise<User> {
    try {
      const user = await this.userModel.findById(userId).exec()

      if (!user) {
        throw new NotFoundException('用户不存在')
      }

      if (!user.socialAccounts) {
        throw new NotFoundException(`未找到绑定的${platform}账号`)
      }

      const initialLength = user.socialAccounts.length
      user.socialAccounts = user.socialAccounts.filter(
        (account) => account.platform !== platform,
      )

      if (user.socialAccounts.length === initialLength) {
        throw new NotFoundException(`未找到绑定的${platform}账号`)
      }

      return user.save()
    } catch (error) {
      this.logger.error('删除用户 Social Account 失败', error)
      throw error
    }
  }

  // TODO 还要匹配isConnected
  async findUserBySocialAccount(
    platform: string,
    accountId: string,
  ): Promise<User> {
    try {
      const user = await this.userModel
        .findOne({
          socialAccounts: {
            $elemMatch: {
              platform,
              accountId,
            },
          },
        })
        .exec()
      if (!user) {
        throw new NotFoundException(
          `User not found with social account ${platform}:${accountId}`,
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
    platform: string,
    updateData: UpdateSocialAccountDto,
  ): Promise<User> {
    try {
      const user = await this.userModel.findById(userId).exec()

      if (!user) {
        throw new NotFoundException('用户不存在')
      }

      // 检查用户是否有社交账号数组
      if (
        !user.socialAccounts ||
        !user.socialAccountTokenStates ||
        !user.socialAccountMiningStates
      ) {
        throw new NotFoundException(`未找到绑定的${platform}账号`)
      }

      // 查找社交账号索引
      const accountIndex = user.socialAccounts.findIndex(
        (account) => account.platform === platform,
      )

      // 查找令牌状态索引
      const tokenStateIndex = user.socialAccountTokenStates.findIndex(
        (tokenState) => tokenState.platform === platform,
      )

      const miningStateIndex = user.socialAccountMiningStates.findIndex(
        (miningState) => miningState.platform === platform,
      )

      // 更新社交账号信息
      if (updateData.socialAccount) {
        if (accountIndex === -1) {
          throw new NotFoundException(`未找到绑定的${platform}账号`)
        }
        user.socialAccounts[accountIndex] = {
          ...user.socialAccounts[accountIndex],
          ...updateData.socialAccount,
        }

        // 如果更新了metrics，需要单独处理
        if (updateData.socialAccount.metrics) {
          user.socialAccounts[accountIndex].metrics = {
            ...user.socialAccounts[accountIndex].metrics,
            ...updateData.socialAccount.metrics,
          }
        }
      }

      // 更新社交账号令牌状态
      if (updateData.socialAccountTokenState) {
        if (tokenStateIndex === -1) {
          throw new NotFoundException(`未找到绑定的${platform}账号`)
        }
        user.socialAccountTokenStates[tokenStateIndex] = {
          ...user.socialAccountTokenStates[tokenStateIndex],
          ...updateData.socialAccountTokenState,
        }
      }

      // 更新社交账号指标状态（如果需要）
      if (updateData.socialAccountMiningState) {
        if (miningStateIndex === -1) {
          throw new NotFoundException(`未找到绑定的${platform}账号`)
        }
        // 更新社交账号中的metrics
        if (user.socialAccountMiningStates[miningStateIndex]) {
          user.socialAccountMiningStates[miningStateIndex] = {
            ...user.socialAccountMiningStates[miningStateIndex],
            ...updateData.socialAccountMiningState,
          }
        }
      }

      return user.save()
    } catch (error) {
      this.logger.error('更新用户社交账号失败', error)
      throw error
    }
  }

  /**
   * 基于权重随机选择一个绑定了特定平台账号且有有效Token的用户
   * 权重基于上次使用时间，使用时间越久权重越大
   * @param platform 社交媒体平台
   * @returns 随机选择的用户ID，如果没有符合条件的用户则返回null
   */
  async findRandomUserIdWithToken(
    platform: 'twitter' | 'instagram' | 'rednote' | 'facebook',
  ): Promise<string> {
    try {
      this.logger.log(`开始基于权重随机选择${platform}平台用户`)

      // 构建匹配条件 - 确保用户有社交账号和令牌状态
      const matchCondition = {
        // 确保用户有社交账号且已连接
        socialAccounts: {
          $elemMatch: {
            platform,
            isConnected: true,
          },
        },
        // 确保用户有令牌状态且令牌有效
        socialAccountTokenStates: {
          $elemMatch: {
            platform,
            ...(platform === 'twitter'
              ? { refreshToken: { $exists: true, $ne: '' } }
              : { accessToken: { $exists: true, $ne: '' } }),
          },
        },
      }

      // 第一步: 计算所有符合条件用户的总权重
      const totalWeightResult = await this.userModel
        .aggregate([
          // 1. 匹配有效的用户
          { $match: matchCondition },
          // 2. 展开socialAccountTokenStates数组
          { $unwind: '$socialAccountTokenStates' },
          // 3. 只保留指定平台的令牌状态
          { $match: { 'socialAccountTokenStates.platform': platform } },
          // 4. 计算每个用户的权重
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
          // 5. 计算总权重
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
        this.logger.warn(`没有可用的${platform}平台用户或总权重为0`)
        throw new NotFoundException(`没有可用的${platform}平台用户或总权重为0`)
      }

      // 第二步: 生成随机数
      const randomNumber = Math.random() * totalWeight
      this.logger.debug(`总权重: ${totalWeight}, 随机数: ${randomNumber}`)

      // 第三步: 执行加权随机查询
      const randomUsers = await this.userModel
        .aggregate([
          // 1. 匹配有效的用户
          { $match: matchCondition },
          // 2. 展开socialAccountTokenStates数组
          { $unwind: '$socialAccountTokenStates' },
          // 3. 只保留指定平台的令牌状态
          { $match: { 'socialAccountTokenStates.platform': platform } },
          // 4. 计算每个用户的权重
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
          // 5. 排序以确保处理顺序固定
          { $sort: { _id: 1 } },
          // 6. 计算累积权重
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
          // 7. 匹配第一个累积权重大于等于随机数的文档
          { $match: { cumulativeWeight: { $gte: randomNumber } } },
          // 8. 只返回第一个匹配的文档
          { $limit: 1 },
          // 9. 只返回需要的字段
          {
            $project: {
              _id: 1,
            },
          },
        ])
        .exec()

      // 如果找到用户，返回ID
      if (randomUsers && randomUsers.length > 0) {
        this.logger.log(`成功选择用户ID: ${randomUsers[0]._id}`)
        return randomUsers[0]._id
      }

      this.logger.warn(`未能找到符合条件的${platform}平台用户`)
      throw new NotFoundException(`未能找到符合条件的${platform}平台用户`)
    } catch (error) {
      this.logger.error(`加权随机选择${platform}平台用户失败`, error)
      throw error
    }
  }

  /**
   * 更新用户社交账号的最后使用时间
   * 仅在令牌成功完整使用后调用此方法
   * @param userId 用户ID
   * @param platform 社交媒体平台
   * @returns 更新后的用户对象
   */
  async updateSocialAccountLastUsedAt(
    userId: string,
    platform: 'twitter' | 'instagram' | 'rednote' | 'facebook',
  ): Promise<User> {
    try {
      this.logger.log(`更新用户 ${userId} 的 ${platform} 账号最后使用时间`)

      // 直接更新指定平台的lastUsedAt字段
      const result = await this.userModel
        .findOneAndUpdate(
          {
            _id: userId,
            'socialAccountTokenStates.platform': platform,
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
          `未找到用户 ${userId} 或其 ${platform} 账号`,
        )
      }

      return result
    } catch (error) {
      this.logger.error(
        `更新用户 ${userId} 的 ${platform} 账号最后使用时间失败`,
        error,
      )
      throw error
    }
  }
}
