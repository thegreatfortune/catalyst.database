// src/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Type } from 'class-transformer'
import { IsBoolean, IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator'
import { Document } from 'mongoose'


export type UserDocument = User & Document

export enum DeviceType {
  Desktop = 'desktop',
  Mobile = 'mobile'
}

export enum SocialProvider {
  X = 'x',
  Telegram = 'telegram',
  Instagram = 'instagram',
  Rednote = 'rednote',
  Facebook = 'facebook'
}

export enum Language {
  zhCN = 'zh-CN',
  enUS = 'en-US'
}

export enum Theme {
  light = 'light',
  dark = 'dark'
}

export enum DefaultCurrency {
  USDT = 'USDT',
  BNB = 'BNB'
}

export enum Timezone {
  'Asia/Shanghai' = 'Asia/Shanghai',
  'America/New_York' = 'America/New_York'
}

export class AnonymousIdentity {
  @Prop({
    type: String,
    required: true,
  })
  id: string

  @Prop({
    type: String,
    required: true,
  })
  name: string

  @Prop({
    type: String,
    required: true,
  })
  avatar: string

  @Prop({
    type: Array<string>,
    required: true,
  })
  preferences?: string[]

  @Prop({
    type: Boolean,
    required: true,
  })
  isActive: boolean

  @Prop({
    type: Boolean,
    required: true,
  })
  isDeleted: boolean

  @Prop({
    type: Date,
    required: true,
  })
  createdAt: Date

  @Prop({
    type: Date,
    required: true,
  })
  updatedAt: Date
}

// export class Metrics {
//   @Prop({
//     type: Number,
//     required: true,
//     min: 0,
//   })
//   followers: number

//   @Prop({
//     type: Number,
//     required: true,
//     min: 0,
//   })
//   following: number

//   @Prop({
//     type: Number,
//     required: true,
//     min: 0,
//   })
//   totalPosts: number
// }

// export class SocialAccount {
//   @Prop({
//     type: String,
//     enum: SocialProvider,
//     required: true,
//   })
//   provider: SocialProvider

//   @Prop({
//     type: String,
//     required: true,
//   })
//   accountId: string

//   @Prop({
//     type: String,
//     required: true,
//   })
//   username: string

//   @Prop({
//     type: String
//   })
//   displayName?: string

//   @Prop({
//     type: String
//   })
//   profileUrl?: string

//   @Prop({
//     type: Metrics,
//     required: true,
//   })
//   metrics: Metrics

//   @Prop({
//     type: Date,
//     required: true,
//   })
//   lastSyncedAt: Date

//   @Prop({
//     type: Boolean,
//     required: true,
//   })
//   isConnected: boolean
// }

// export class SocialAccountMiningState {
//   @Prop({
//     type: String,
//     enum: SocialProvider,
//     required: true,
//   })
//   provider: SocialProvider

//   @Prop({
//     type: Number,
//     required: true,
//     min: 0,
//   })
//   points: number

//   @Prop({
//     type: Number,
//     required: true,
//     min: 0,
//   })
//   count: number
// }

// export class SocialAccountTokenState {
//   @Prop({
//     type: String,
//     enum: SocialProvider,
//     required: true,
//   })
//   provider: SocialProvider

//   @Prop({
//     type: String
//   })
//   accessToken?: string

//   @Prop({
//     type: String
//   })
//   refreshToken?: string

//   @Prop({
//     type: Date
//   })
//   tokenExpiry?: Date

//   @Prop({
//     type: String
//   })
//   scope?: string

//   @Prop({
//     type: Date
//   })
//   lastUsedAt?: Date
// }

export class RefreshTokenInfo {
  @Prop({
    type: String,
    required: true,
  })
  token: string

  @Prop({
    type: String,
    required: true,
  })
  deviceType: DeviceType

  @Prop({
    type: Date,
    required: true,
  })
  issuedAt: Date
}

export class UI {
  @Prop({
    type: String,
    enum: Language,
    required: true,
  })
  language: Language

  @Prop({
    type: String,
    enum: Theme,
    required: true,
  })
  theme: Theme

  @Prop({
    type: String,
    enum: DefaultCurrency,
    required: true,
  })
  defaultCurrency: DefaultCurrency

  @Prop({
    type: String,
    enum: Timezone,
    required: true,
  })
  timezone: Timezone
}

export class AI {
  @Prop({
    type: Boolean,
    required: true,
  })
  enabled: boolean
}

export class Anonymous {
  @Prop({
    type: Boolean,
    required: true,
  })
  enabled: boolean
}

export class Notifications {
  @Prop({
    type: Boolean,
    required: true,
  })
  push: boolean

  @Prop({
    type: Boolean,
    required: true,
  })
  contentMentions: boolean

  @Prop({
    type: Boolean,
    required: true,
  })
  newFollowers: boolean

  @Prop({
    type: Boolean,
    required: true,
  })
  contentInteractions: boolean
}

export class Privacy {
  @Prop({
    type: String,
    required: true,
  })
  profileVisibility: string

  @Prop({
    type: Boolean,
    required: true,
  })
  showWalletActivity: boolean

  @Prop({
    type: Boolean,
    required: true,
  })
  allowDirectMessages: boolean
}

export class ContentPreferences {
  @Prop({
    type: Array<string>,
  })
  topics?: string[]

  @Prop({
    type: Array<string>,
  })
  blockedKeywords?: string[]
}

export class Preferences {
  @Prop({
    type: UI,
    required: true,
  })
  ui: UI

  @Prop({
    type: AI,
    required: true,
  })
  ai: AI

  @Prop({
    type: Anonymous,
    required: true,
  })
  anonymous: Anonymous

  @Prop({
    type: Notifications
  })
  notifications?: Notifications

  @Prop({
    type: Privacy
  })
  privacy?: Privacy

  @Prop({
    type: ContentPreferences
  })
  contentPreferences?: ContentPreferences
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  walletAddress: string

  @Prop({ required: true, default: 56 })
  chainId: number

  @Prop({ required: true })
  lastSignedAt: Date

  @Prop({ required: true })
  name: string

  @Prop({ unique: true, sparse: true })
  email?: string

  @Prop()
  bio?: string

  @Prop({ default: true })
  isActive: boolean

  @Prop({ type: Object })
  walletInfo?: {
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
  preferences: Preferences

  @Prop()
  refreshTokens: Array<RefreshTokenInfo>

  @Prop()
  anonymousIdentities?: Array<AnonymousIdentity>

  // @Prop({
  //   type: [
  //     {
  //       type: Object,
  //       // 确保每个平台只能绑定一个账号
  //       validate: {
  //         validator: function (socialAccounts: SocialAccount[]) {
  //           const providers = socialAccounts.map((account) => account.provider)
  //           return providers.length === new Set(providers).size
  //         },
  //         message: '每个社交媒体平台只能绑定一个账号',
  //       },
  //     },
  //   ],
  //   description: '用户社交媒体账号信息',
  // })
  // socialAccounts?: SocialAccount[]

  // @Prop({
  //   type: [
  //     {
  //       type: Object,
  //       // 确保每个平台只能绑定一个账号
  //       validate: {
  //         validator: function (
  //           socialAccountTokenStates: SocialAccountTokenState[],
  //         ) {
  //           const providers = socialAccountTokenStates.map(
  //             (account) => account.provider,
  //           )
  //           return providers.length === new Set(providers).size
  //         },
  //         message: '每个社交媒体平台只能有1个 socialAccountTokenState',
  //       },
  //     },
  //   ],
  //   description: '用户统计信息',
  // })
  // socialAccountTokenStates?: SocialAccountTokenState[]

  // @Prop({
  //   type: [
  //     {
  //       type: Object,
  //       // 确保每个平台只能有1个 miningState
  //       validate: {
  //         validator: function (
  //           socialAccountMiningStates: SocialAccountMiningState[],
  //         ) {
  //           const providers = socialAccountMiningStates.map(
  //             (account) => account.provider,
  //           )
  //           return providers.length === new Set(providers).size
  //         },
  //         message: '每个社交媒体平台只能有1个 socialAccountMiningState',
  //       },
  //     },
  //   ],
  //   description: '用户社交媒体平台的挖矿状态',
  // })
  // socialAccountMiningStates?: SocialAccountMiningState[]
}

export const UserSchema = SchemaFactory.createForClass(User)

// 创建索引
UserSchema.index({ walletAddress: 1, chainId: 1 }, { unique: true })
UserSchema.index({ isActive: 1 })
UserSchema.index({ createdAt: -1 })
UserSchema.index({ 'stats.followers': -1 })
UserSchema.index({
  'socialAccounts.platform': 1,
  'socialAccounts.accountId': 1,
})
UserSchema.index({ 'walletInfo.ens': 1 })
