import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, SocialAccount, MiningState } from '../schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Logger } from '@nestjs/common';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const createdUser = new this.userModel(createUserDto);
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
    socialAccount: SocialAccount,
  ): Promise<User> {
    try {
      const user = await this.userModel.findById(userId).exec();

      if (!user) {
        throw new NotFoundException('用户不存在');
      }

      // 检查是否已存在相同平台的社交账号
      const existingAccountIndex = user.socialAccounts?.findIndex(
        (account) => account.platform === socialAccount.platform,
      );

      if (existingAccountIndex !== -1 && existingAccountIndex !== undefined) {
        // 更新现有社交账号
        user.socialAccounts[existingAccountIndex] = {
          ...user.socialAccounts[existingAccountIndex],
          ...socialAccount,
        };
      } else {
        // 添加新社交账号
        if (!user.socialAccounts) {
          user.socialAccounts = [];
        }
        user.socialAccounts.push(socialAccount);
      }

      return user.save();
    } catch (error) {
      this.logger.error('添加用户 Social Account 失败', error);
      throw error;
    }
  }

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

  async updateSocialAccountConnectionStatus(
    userId: string,
    platform: string,
    updateData: Partial<SocialAccount>,
  ): Promise<User> {
    try {
      const user = await this.userModel.findById(userId).exec();

      if (!user) {
        throw new HttpException('用户不存在', HttpStatus.NOT_FOUND);
      }

      const accountIndex = user.socialAccounts?.findIndex(
        (account) => account.platform === platform,
      );

      if (accountIndex === -1 || accountIndex === undefined) {
        throw new HttpException(
          `未找到绑定的${platform}账号`,
          HttpStatus.NOT_FOUND,
        );
      }

      // 更新社交账号信息
      user.socialAccounts[accountIndex] = {
        ...user.socialAccounts[accountIndex],
        ...updateData,
      };

      return user.save();
    } catch (error) {
      this.logger.error('更新用户 Social Account 失败', error);
      throw error;
    }
  }

  async updateMiningState(
    userId: string,
    platform: string,
    updateData: Partial<MiningState>,
  ): Promise<User> {
    try {
      const user = await this.userModel.findById(userId).exec();

      if (!user) {
        throw new NotFoundException('用户不存在');
      }

      const miningStateIndex = user.miningStates?.findIndex(
        (account) => account.platform === platform,
      );

      if (miningStateIndex === -1 || miningStateIndex === undefined) {
        throw new NotFoundException(`未找到绑定的${platform}账号`);
      }

      // 更新社交账号信息
      user.miningStates[miningStateIndex] = {
        ...user.miningStates[miningStateIndex],
        ...updateData,
      };

      return user.save();
    } catch (error) {
      this.logger.error('更新用户 Mining State 失败', error);
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
