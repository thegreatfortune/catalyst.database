import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { randomBytes } from 'crypto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // 基本 CRUD 功能
  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByWalletAddress(walletAddress: string): Promise<User> {
    const user = await this.userModel.findOne({ walletAddress }).exec();
    if (!user) {
      throw new NotFoundException(`User with wallet address ${walletAddress} not found`);
    }
    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const newUser = new this.userModel({
      ...createUserDto,
      nonce: this.generateNonce(),
    });
    return newUser.save();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return updatedUser;
  }

  async remove(id: string): Promise<User | null> {
    const deletedUser = await this.userModel.findByIdAndDelete(id).exec();
    if (!deletedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return deletedUser;
  }

  // JWT 相关数据管理
  async generateNonce(): Promise<string> {
    return randomBytes(16).toString('hex');
  }

  async updateNonce(walletAddress: string): Promise<string> {
    const nonce = this.generateNonce();
    await this.userModel.findOneAndUpdate(
      { walletAddress },
      { nonce },
      { new: true },
    );
    return nonce;
  }

  async updateSignature(
    walletAddress: string,
    signature: string,
  ): Promise<User | null> {
    return this.userModel.findOneAndUpdate(
      { walletAddress },
      {
        lastSignature: signature,
        lastSignedAt: new Date(),
        nonce: this.generateNonce(), // 更新 nonce 防止重放攻击
      },
      { new: true },
    );
  }

  async verifyNonce(walletAddress: string, nonce: string): Promise<boolean> {
    const user = await this.userModel.findOne({ walletAddress }).exec();
    return user?.nonce === nonce;
  }

  // 钱包地址相关方法
  async findUsersByChainType(chainType: string): Promise<User[]> {
    return this.userModel.find({ chainType }).exec();
  }

  // 社交账号管理
  async addSocialAccount(
    userId: string,
    socialAccount: any,
  ): Promise<User | null> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // 检查是否已存在相同平台的账号
    const existingAccountIndex = user.socialAccounts.findIndex(
      (account) => account.platform === socialAccount.platform,
    );

    if (existingAccountIndex >= 0) {
      // 更新现有账号
      user.socialAccounts[existingAccountIndex] = {
        ...user.socialAccounts[existingAccountIndex],
        ...socialAccount,
      };
    } else {
      // 添加新账号
      user.socialAccounts.push(socialAccount);
    }

    return user.save();
  }

  async removeSocialAccount(
    userId: string,
    platform: string,
  ): Promise<User | null> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    user.socialAccounts = user.socialAccounts.filter(
      (account) => account.platform !== platform,
    );

    return user.save();
  }

  async findUserBySocialAccount(
    platform: string,
    accountId: string,
  ): Promise<User | null> {
    return this.userModel
      .findOne({
        'socialAccounts.platform': platform,
        'socialAccounts.accountId': accountId,
      })
      .exec();
  }

  async updateSocialAccountConnectionStatus(
    userId: string,
    platform: string,
    isConnected: boolean,
  ): Promise<User | null> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const accountIndex = user.socialAccounts.findIndex(
      (account) => account.platform === platform,
    );

    if (accountIndex >= 0) {
      user.socialAccounts[accountIndex].isConnected = isConnected;
      return user.save();
    }

    throw new NotFoundException(
      `Social account with platform ${platform} not found for user ${userId}`,
    );
  }
}
