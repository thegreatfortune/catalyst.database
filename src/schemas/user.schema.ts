// src/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Type } from 'class-transformer'
import { IsBoolean, IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator'
import { Document } from 'mongoose'

export type UserDocument = User & Document

export enum DeviceType {
  Desktop = 'desktop',
  Mobile = 'mobile'
}

export enum SocialProvider {
  X = 'x',
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
  @Prop()
  @IsString()
  @IsNotEmpty()
  id: string

  @Prop()
  @IsString()
  @IsNotEmpty()
  name: string

  @Prop()
  @IsString()
  @IsNotEmpty()
  avatar: string

  @Prop()
  @IsOptional()
  @ValidateNested()
  @Type(() => Array<string>)
  preferences?: string[]
}

export class Metrics {
  @Prop()
  @IsNumber()
  @IsNotEmpty()
  followers: number

  @Prop()
  @IsNumber()
  @IsNotEmpty()
  following: number

  @Prop()
  @IsNumber()
  @IsNotEmpty()
  totalPosts: number
}

export class SocialAccount {
  @Prop()
  @IsEnum(SocialProvider)
  @IsNotEmpty()
  provider: SocialProvider

  @Prop()
  @IsString()
  @IsNotEmpty()
  accountId: string

  @Prop()
  @IsString()
  @IsNotEmpty()
  username: string

  @Prop()
  @IsString()
  @IsOptional()
  displayName?: string

  @Prop()
  @IsString()
  @IsOptional()
  profileUrl?: string

  @Prop()
  @ValidateNested()
  @Type(() => Metrics)
  metrics: Metrics

  @Prop()
  @IsDate()
  @IsNotEmpty()
  lastSyncedAt: Date

  @Prop()
  @IsBoolean()
  @IsOptional()
  isConnected: boolean
}


export class SocialAccountMiningState {
  @Prop()
  @IsEnum(SocialProvider)
  @IsNotEmpty()
  provider: SocialProvider

  @Prop()
  @IsNumber()
  @IsNotEmpty()
  points: number

  @Prop()
  @IsNumber()
  @IsNotEmpty()
  count: number
}

export class SocialAccountTokenState {
  @Prop()
  @IsEnum(SocialProvider)
  @IsNotEmpty()
  provider: SocialProvider

  @Prop()
  @IsString()
  @IsOptional()
  accessToken?: string

  @Prop()
  @IsString()
  @IsOptional()
  refreshToken?: string

  @Prop()
  @IsDate()
  @IsOptional()
  tokenExpiry?: Date

  @Prop()
  @IsString()
  @IsOptional()
  scope?: string
  lastUsedAt?: Date
}

export class RefreshTokenInfo {
  @Prop()
  @IsString()
  @IsNotEmpty()
  token: string

  @Prop()
  @IsEnum(DeviceType)
  @IsNotEmpty()
  deviceType: DeviceType

  @Prop()
  @IsDate()
  @IsNotEmpty()
  issuedAt: Date
}

export class UI {
  @Prop()
  @IsEnum(Language)
  @IsNotEmpty()
  language: Language

  @Prop()
  @IsEnum(Theme)
  @IsNotEmpty()
  theme: Theme

  @Prop()
  @IsEnum(DefaultCurrency)
  @IsNotEmpty()
  defaultCurrency: DefaultCurrency

  @Prop()
  @IsEnum(Timezone)
  @IsNotEmpty()
  timezone: Timezone
}

export class AI {
  @Prop()
  @IsBoolean()
  @IsNotEmpty()
  enabled: boolean
}

export class Anonymous {
  @Prop()
  @IsBoolean()
  @IsNotEmpty()
  enabled: boolean
}

export class Notifications {
  @Prop()
  @IsBoolean()
  @IsNotEmpty()
  push: boolean

  @Prop()
  @IsBoolean()
  @IsNotEmpty()
  contentMentions: boolean

  @Prop()
  @IsBoolean()
  @IsNotEmpty()
  newFollowers: boolean

  @Prop()
  @IsBoolean()
  @IsNotEmpty()
  contentInteractions: boolean
}

export class Privacy {
  @Prop()
  @IsString()
  @IsNotEmpty()
  profileVisibility: string

  @Prop()
  @IsBoolean()
  @IsNotEmpty()
  showWalletActivity: boolean

  @Prop()
  @IsBoolean()
  @IsNotEmpty()
  allowDirectMessages: boolean
}

export class ContentPreferences {
  @Prop()
  @ValidateNested()
  @Type(() => Object)
  topics?: string[]

  @Prop()
  @ValidateNested()
  @Type(() => Object)
  blockedKeywords?: string[]
}

export class Preferences {
  @Prop()
  @ValidateNested()
  @Type(() => UI)
  ui: UI

  @Prop()
  @ValidateNested()
  @Type(() => AI)
  ai: AI

  @Prop()
  @ValidateNested()
  @Type(() => Anonymous)
  anonymous: Anonymous

  @Prop()
  @ValidateNested()
  @Type(() => Notifications)
  notifications?: Notifications

  @Prop()
  @ValidateNested()
  @Type(() => Privacy)
  privacy?: Privacy

  @Prop()
  @ValidateNested()
  @Type(() => ContentPreferences)
  contentPreferences?: ContentPreferences
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, index: true })
  walletAddress: string

  @Prop({ required: true, default: 56 })
  chainId: number

  @Prop()
  lastSignedAt: Date

  @Prop()
  name: string

  @Prop()
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

  @Prop({
    type: [
      {
        type: Object,
        // 确保每个平台只能绑定一个账号
        validate: {
          validator: function (socialAccounts: SocialAccount[]) {
            const providers = socialAccounts.map((account) => account.provider)
            return providers.length === new Set(providers).size
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
            const providers = socialAccountTokenStates.map(
              (account) => account.provider,
            )
            return providers.length === new Set(providers).size
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
            const providers = socialAccountMiningStates.map(
              (account) => account.provider,
            )
            return providers.length === new Set(providers).size
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
