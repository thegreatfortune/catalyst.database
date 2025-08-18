import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, IUserSocialAccount } from '../schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User not found with id ${id}`);
    }
    return user;
  }

  async findByWalletAddress(address: string): Promise<User> {
    const user = await this.userModel
      .findOne({ 'wallets.address': address })
      .exec();
    if (!user) {
      throw new NotFoundException(
        `User not found with wallet address ${address}`,
      );
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();
    if (!user) {
      throw new NotFoundException(`User not found with id ${id}`);
    }
    return user;
  }

  async remove(id: string): Promise<User> {
    const user = await this.userModel.findByIdAndDelete(id).exec();
    if (!user) {
      throw new NotFoundException(`User not found with id ${id}`);
    }
    return user;
  }

  async findUsersByChainType(chainType: string): Promise<User[]> {
    return this.userModel.find({ 'wallets.chainType': chainType }).exec();
  }

  // 社交账号相关方法
  async addSocialAccount(
    userId: string,
    socialAccount: IUserSocialAccount,
  ): Promise<User> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.NOT_FOUND);
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
  }

  async removeSocialAccount(userId: string, platform: string): Promise<User> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.NOT_FOUND);
    }

    if (!user.socialAccounts) {
      throw new HttpException(
        `未找到绑定的${platform}账号`,
        HttpStatus.NOT_FOUND,
      );
    }

    const initialLength = user.socialAccounts.length;
    user.socialAccounts = user.socialAccounts.filter(
      (account) => account.platform !== platform,
    );

    if (user.socialAccounts.length === initialLength) {
      throw new HttpException(
        `未找到绑定的${platform}账号`,
        HttpStatus.NOT_FOUND,
      );
    }

    return user.save();
  }

  async findUserBySocialAccount(
    platform: string,
    accountId: string,
  ): Promise<User> {
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
  }

  async updateSocialAccountConnectionStatus(
    userId: string,
    platform: string,
    updateData: Partial<IUserSocialAccount>,
  ): Promise<User> {
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
  }
}
