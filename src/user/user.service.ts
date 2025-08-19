import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  User,
  SocialAccount,
  Metrics,
  SocialAccountTokenState,
  SocialAccountMiningState,
} from '../schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Logger } from '@nestjs/common';
import { UpdateSocialAccountDto } from './dto/update-social-account.dto';
import {
  SocialAccountAddDto,
  SocialAccountTokenStateAddDto,
} from './dto/add-social-account.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

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
      };

      const createdUser = new this.userModel(user);
      return createdUser.save();
    } catch (error) {
      this.logger.error('创建用户失败', error);
      throw error;
    }
  }

  async findAll(): Promise<User[]> {
    try {
      return this.userModel.find().exec();
    } catch (error) {
      this.logger.error('查询用户失败', error);
      throw error;
    }
  }

  async findById(id: string): Promise<User> {
    try {
      const user = await this.userModel.findById(id).exec();
      if (!user) {
        throw new NotFoundException(`User not found with id ${id}`);
      }
      return user;
    } catch (error) {
      this.logger.error('使用 ID 查找用户失败', error);
      throw error;
    }
  }

  async findByWalletAddress(address: string): Promise<User> {
    try {
      const user = await this.userModel
        .findOne({ 'wallets.address': address })
        .exec();
      if (!user) {
        throw new NotFoundException(
          `User not found with wallet address ${address}`,
        );
      }
      return user;
    } catch (error) {
      this.logger.error('使用 wallet address 查找用户失败', error);
      throw error;
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      const user = await this.userModel
        .findByIdAndUpdate(id, updateUserDto, { new: true })
        .exec();
      if (!user) {
        throw new NotFoundException(`User not found with id ${id}`);
      }
      return user;
    } catch (error) {
      this.logger.error('更新用户失败', error);
      throw error;
    }
  }

  async remove(id: string): Promise<User> {
    try {
      const user = await this.userModel.findByIdAndDelete(id).exec();
      if (!user) {
        throw new NotFoundException(`User not found with id ${id}`);
      }
      return user;
    } catch (error) {
      this.logger.error('删除用户失败', error);
      throw error;
    }
  }

  async findUsersByChainType(chainType: string): Promise<User[]> {
    try {
      return this.userModel.find({ 'wallets.chainType': chainType }).exec();
    } catch (error) {
      this.logger.error('使用 Chain Type 查询用户失败', error);
      throw error;
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
      const user = await this.userModel.findById(userId).exec();

      if (!user) {
        throw new NotFoundException('用户不存在');
      }

      if (
        !user.socialAccounts ||
        !user.socialAccountTokenStates ||
        !user.socialAccountMiningStates
      ) {
        user.socialAccounts = [];
        user.socialAccountTokenStates = [];
        user.socialAccountMiningStates = [];
      }

      // 检查是否已存在相同平台的社交账号
      const existingAccountIndex = user.socialAccounts.findIndex(
        (account) => account.platform === platform,
      );

      if (existingAccountIndex === -1) {
        const metrics: Metrics = {
          followers: socialAccountDto.metrics.followers,
          following: socialAccountDto.metrics.following,
          totalPosts: socialAccountDto.metrics.totalPosts,
        };
        const socialAccount: SocialAccount = {
          platform,
          accountId: socialAccountDto.accountId,
          username: socialAccountDto.username,
          displayName: socialAccountDto.displayName,
          profileUrl: socialAccountDto.profileUrl,
          metrics: metrics,
          lastSyncedAt: socialAccountDto.lastSyncedAt,
          isConnected: socialAccountDto.isConnected,
        };

        const socialAccountTokenState: SocialAccountTokenState = {
          platform,
          accessToken: socialAccountTokenStateDto.accessToken,
          refreshToken: socialAccountTokenStateDto.refreshToken,
          tokenExpiry: socialAccountTokenStateDto.tokenExpiry,
          scope: socialAccountTokenStateDto.scope,
        };

        const socialAccountMiningState: SocialAccountMiningState = {
          platform,
          points: 0,
          count: 0,
        };

        // 添加新社交账号
        user.socialAccounts.push(socialAccount);
        user.socialAccountTokenStates.push(socialAccountTokenState);
        user.socialAccountMiningStates.push(socialAccountMiningState);
      } else {
        throw new BadRequestException('用户已绑定该社交账号');
      }

      return user.save();
    } catch (error) {
      this.logger.error('添加用户 Social Account 失败', error);
      throw error;
    }
  }

  // TODO 移除只做逻辑删除
  async removeSocialAccount(userId: string, platform: string): Promise<User> {
    try {
      const user = await this.userModel.findById(userId).exec();

      if (!user) {
        throw new NotFoundException('用户不存在');
      }

      if (!user.socialAccounts) {
        throw new NotFoundException(`未找到绑定的${platform}账号`);
      }

      const initialLength = user.socialAccounts.length;
      user.socialAccounts = user.socialAccounts.filter(
        (account) => account.platform !== platform,
      );

      if (user.socialAccounts.length === initialLength) {
        throw new NotFoundException(`未找到绑定的${platform}账号`);
      }

      return user.save();
    } catch (error) {
      this.logger.error('删除用户 Social Account 失败', error);
      throw error;
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
        .exec();
      if (!user) {
        throw new NotFoundException(
          `User not found with social account ${platform}:${accountId}`,
        );
      }
      return user;
    } catch (error) {
      this.logger.error('使用 Social Account 查找用户失败', error);
      throw error;
    }
  }

  async updateSocialAccount(
    userId: string,
    platform: string,
    updateData: UpdateSocialAccountDto,
  ): Promise<User> {
    try {
      const user = await this.userModel.findById(userId).exec();

      if (!user) {
        throw new NotFoundException('用户不存在');
      }

      // 检查用户是否有社交账号数组
      if (
        !user.socialAccounts ||
        !user.socialAccountTokenStates ||
        !user.socialAccountMiningStates
      ) {
        throw new NotFoundException(`未找到绑定的${platform}账号`);
      }

      // 查找社交账号索引
      const accountIndex = user.socialAccounts.findIndex(
        (account) => account.platform === platform,
      );

      // 查找令牌状态索引
      const tokenStateIndex = user.socialAccountTokenStates.findIndex(
        (tokenState) => tokenState.platform === platform,
      );

      const miningStateIndex = user.socialAccountMiningStates.findIndex(
        (miningState) => miningState.platform === platform,
      );

      // 更新社交账号信息
      if (updateData.socialAccount) {
        if (accountIndex === -1) {
          throw new NotFoundException(`未找到绑定的${platform}账号`);
        }
        user.socialAccounts[accountIndex] = {
          ...user.socialAccounts[accountIndex],
          ...updateData.socialAccount,
        };

        // 如果更新了metrics，需要单独处理
        if (updateData.socialAccount.metrics) {
          user.socialAccounts[accountIndex].metrics = {
            ...user.socialAccounts[accountIndex].metrics,
            ...updateData.socialAccount.metrics,
          };
        }
      }

      // 更新社交账号令牌状态
      if (updateData.socialAccountTokenState) {
        if (tokenStateIndex === -1) {
          throw new NotFoundException(`未找到绑定的${platform}账号`);
        }
        user.socialAccountTokenStates[tokenStateIndex] = {
          ...user.socialAccountTokenStates[tokenStateIndex],
          ...updateData.socialAccountTokenState,
        };
      }

      // 更新社交账号指标状态（如果需要）
      if (updateData.socialAccountMiningState) {
        if (miningStateIndex === -1) {
          throw new NotFoundException(`未找到绑定的${platform}账号`);
        }
        // 更新社交账号中的metrics
        if (user.socialAccountMiningStates[miningStateIndex]) {
          user.socialAccountMiningStates[miningStateIndex] = {
            ...user.socialAccountMiningStates[miningStateIndex],
            ...updateData.socialAccountMiningState,
          };
        }
      }

      return user.save();
    } catch (error) {
      this.logger.error('更新用户社交账号失败', error);
      throw error;
    }
  }
  /**
   * 随机选择一个绑定了Twitter账号且有accessToken的用户
   * 使用MongoDB的聚合管道实现高效的随机选择
   * @returns 随机选择的用户，如果没有符合条件的用户则返回null
   */
  async findRandomUserIdWithToken(
    platform: 'twitter' | 'instagram',
  ): Promise<string | null> {
    try {
      // 构建匹配条件
      let matchCondition: {
        socialAccounts: {
          $elemMatch: {
            platform: 'twitter' | 'instagram';
            refreshToken?: { $exists: boolean; $ne: string };
            accessToken?: { $exists: boolean; $ne: string };
            isConnected: boolean;
          };
        };
      };

      if (platform === 'twitter') {
        // Twitter平台需要匹配refreshToken
        matchCondition = {
          socialAccounts: {
            $elemMatch: {
              platform,
              refreshToken: { $exists: true, $ne: '' },
              isConnected: true,
            },
          },
        };
      } else {
        // 其他平台匹配accessToken
        matchCondition = {
          socialAccounts: {
            $elemMatch: {
              platform,
              accessToken: { $exists: true, $ne: '' },
              isConnected: true,
            },
          },
        };
      }

      // 查找符合条件的用户
      const users = await this.userModel
        .aggregate([
          // 应用构建的匹配条件
          { $match: matchCondition },
          // 随机排序
          { $sample: { size: 1 } },
        ])
        .exec();

      // 如果找到用户，返回第一个（也是唯一一个）
      if (users && users.length > 0) {
        return users[0].id;
      }

      // 没有找到符合条件的用户
      return null;
    } catch (error) {
      this.logger.error('随机选择用户失败', error);
      throw error;
    }
  }
}
