// src/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export interface IUserSocialAccount {
  platform: 'twitter' | 'instagram' | 'rednote' | 'facebook';
  accountId: string;
  username: string;
  displayName?: string;
  profileUrl?: string;

  // OAuth相关
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;

  // 连接状态 - 简单布尔值
  isConnected: boolean;
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, index: true })
  walletAddress: string;

  @Prop({ required: true, default: 'bnb' })
  chainType: string;

  @Prop()
  lastSignature: string;

  @Prop()
  lastSignedAt: Date;

  @Prop()
  displayName: string;

  @Prop()
  avatar: string;

  @Prop()
  bio: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Object })
  walletInfo: {
    ens?: string;
    balance?: string;
    tokenBalances?: {
      tokenAddress: string;
      symbol: string;
      balance: string;
      decimals: number;
    }[];
  };

  @Prop({ type: Object, description: '用户偏好设置' })
  preferences: {
    notifications?: {
      push: boolean;
      contentMentions: boolean;
      newFollowers: boolean;
      contentInteractions: boolean;
    };
    privacy?: {
      profileVisibility: string;
      showWalletActivity: boolean;
      allowDirectMessages: boolean;
    };
    interface?: {
      theme: string;
      language: string;
      timezone: string;
    };
    contentPreferences?: {
      topics: string[];
      blockedKeywords: string[];
    };
  };

  @Prop({ type: Object, description: '用户统计信息' })
  stats: {
    totalPosts: number;
    totalComments: number;
    followers: number;
    following: number;
    contentViews: number;
    lastActivityAt: Date;
  };

  @Prop({
    type: [
      {
        type: Object,
        // 确保每个平台只能绑定一个账号
        validate: {
          validator: function (socialAccounts: IUserSocialAccount[]) {
            const platforms = socialAccounts.map((account) => account.platform);
            return platforms.length === new Set(platforms).size;
          },
          message: '每个社交媒体平台只能绑定一个账号',
        },
      },
    ],
  })
  socialAccounts: IUserSocialAccount[];
}

export const UserSchema = SchemaFactory.createForClass(User);

// 创建索引
UserSchema.index({ walletAddress: 1 });
UserSchema.index({ chainType: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ 'stats.followers': -1 });
UserSchema.index({ 'stats.lastActivityAt': -1 });
UserSchema.index({
  'socialAccounts.platform': 1,
  'socialAccounts.accountId': 1,
});
UserSchema.index({ 'walletInfo.ens': 1 });
