// src/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose from 'mongoose'


export type UserDocument = mongoose.HydratedDocument<User>

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

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_: UserDocument, ret: any) => {

      ret.id = ret._id?.toString() || ''
      delete ret._id
      delete ret.__v
      ret.lastSignedAt = ret.lastSignedAt.toISOString()
      delete ret.createdAt
      delete ret.updatedAt
      // ret.createdAt = ret.createdAt.toISOString()
      // ret.updatedAt = ret.updatedAt.toISOString()

      if (ret.userId) {
        ret.userId = ret.userId.toString()
      }

      return ret
    },
  },
})
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

}

export const UserSchema = SchemaFactory.createForClass(User)

// 创建索引
UserSchema.index({ walletAddress: 1, chainId: 1 }, { unique: true })
UserSchema.index({ isActive: 1 })
UserSchema.index({ createdAt: -1 })
UserSchema.index({ 'refreshTokens.token': 1, 'refreshTokens.deviceType': 1 }, { unique: true })
UserSchema.index({ 'walletInfo.ens': 1 })
