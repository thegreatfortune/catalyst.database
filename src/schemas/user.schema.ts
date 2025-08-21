// src/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import { PlatformType } from 'src/user/dto/refresh-token.dto'

export type UserDocument = User & Document

export interface SocialAccount {
  platform: 'twitter' | 'instagram' | 'rednote' | 'facebook'
  accountId: string
  username: string
  displayName?: string
  profileUrl?: string
  metrics: Metrics
  lastSyncedAt: Date
  isConnected: boolean
}
export interface Metrics {
  followers: number
  following: number
  totalPosts: number
}

export interface SocialAccountMiningState {
  platform: 'twitter' | 'instagram' | 'rednote' | 'facebook'
  points: number
  count: number
}

export interface SocialAccountTokenState {
  platform: 'twitter' | 'instagram' | 'rednote' | 'facebook'
  // OAuth相关
  accessToken?: string
  refreshToken?: string
  tokenExpiry?: Date
  scope?: string
  lastUsedAt?: Date
}

export interface RefreshTokenInfo {
  token: string
  platformType: PlatformType
  issuedAt: Date
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, index: true })
  walletAddress: string

  @Prop({ required: true, default: 'bnb' })
  chainType: string

  @Prop()
  lastSignedAt: Date

  @Prop()
  displayName: string

  @Prop()
  avatar?: string

  @Prop()
  bio?: string

  @Prop({ default: true })
  isActive: boolean

  @Prop({ type: Object })
  walletInfo: {
    ens?: string
    balance?: string
    tokenBalances?: {
      tokenAddress: string
      symbol: string
      balance: string
      decimals: number
    }[]
  }

  @Prop({ type: Object, description: '用户偏好设置' })
  preferences: {
    notifications?: {
      push: boolean
      contentMentions: boolean
      newFollowers: boolean
      contentInteractions: boolean
    }
    privacy?: {
      profileVisibility: string
      showWalletActivity: boolean
      allowDirectMessages: boolean
    }
    interface?: {
      theme: string
      language: string
      timezone: string
    }
    contentPreferences?: {
      topics: string[]
      blockedKeywords: string[]
    }
  }

  @Prop()
  refreshTokens: Array<RefreshTokenInfo>

  @Prop({
    type: [
      {
        type: Object,
        // 确保每个平台只能绑定一个账号
        validate: {
          validator: function (socialAccounts: SocialAccount[]) {
            const platforms = socialAccounts.map((account) => account.platform)
            return platforms.length === new Set(platforms).size
          },
          message: '每个社交媒体平台只能绑定一个账号',
        },
      },
    ],
    description: '用户社交媒体账号信息',
  })
  socialAccounts?: SocialAccount[]

  @Prop({
    type: [
      {
        type: Object,
        // 确保每个平台只能绑定一个账号
        validate: {
          validator: function (
            socialAccountTokenStates: SocialAccountTokenState[],
          ) {
            const platforms = socialAccountTokenStates.map(
              (account) => account.platform,
            )
            return platforms.length === new Set(platforms).size
          },
          message: '每个社交媒体平台只能有1个 socialAccountTokenState',
        },
      },
    ],
    description: '用户统计信息',
  })
  socialAccountTokenStates?: SocialAccountTokenState[]

  @Prop({
    type: [
      {
        type: Object,
        // 确保每个平台只能有1个 miningState
        validate: {
          validator: function (
            socialAccountMiningStates: SocialAccountMiningState[],
          ) {
            const platforms = socialAccountMiningStates.map(
              (account) => account.platform,
            )
            return platforms.length === new Set(platforms).size
          },
          message: '每个社交媒体平台只能有1个 socialAccountMiningState',
        },
      },
    ],
    description: '用户社交媒体平台的挖矿状态',
  })
  socialAccountMiningStates?: SocialAccountMiningState[]
}

export const UserSchema = SchemaFactory.createForClass(User)

// 创建索引
UserSchema.index({ chainType: 1 })
UserSchema.index({ isActive: 1 })
UserSchema.index({ createdAt: -1 })
UserSchema.index({ 'stats.followers': -1 })
UserSchema.index({
  'socialAccounts.platform': 1,
  'socialAccounts.accountId': 1,
})
UserSchema.index({ 'walletInfo.ens': 1 })
