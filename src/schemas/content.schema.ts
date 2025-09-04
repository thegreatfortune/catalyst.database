// src/schemas/content.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { SocialProvider } from './user.schema'
import mongoose from 'mongoose'
import { RawTweet } from 'src/content/dto/update-content.dto'
import { TweetPublicMetricsV2 } from 'twitter-api-v2'

export enum ContentStatus {
  RAW = 'raw',
  DRAFT = 'draft',
  PUBLISHED = 'published',
  SCHEDULED = 'scheduled',
  FAILED = 'failed'
}

export enum ContentType {
  POST = 'post',
  THREAD = 'thread',
  LONGPOST = 'longPost',
  COMMENT = 'comment',
  STORY = 'story'
}

export enum ContentAttribute {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  POLL = 'poll',
  LINK = 'link'
}

export class Metrics {
  @Prop({ type: Number, default: 0, description: '匿名评论数' })
  anonComments: number
}

export class PublicMetrics implements TweetPublicMetricsV2 {

  @Prop({ type: Number, default: 0, description: '分享数' })
  retweet_count: number

  @Prop({ type: Number, default: 0, description: '评论数' })
  reply_count: number

  @Prop({ type: Number, default: 0, description: '点赞数' })
  like_count: number

  @Prop({ type: Number, default: 0, description: '引用数' })
  quote_count: number

  @Prop({ type: Number, default: 0, description: '收藏数' })
  bookmark_count: number

  @Prop({ type: Number, default: 0, description: '曝光数' })
  impression_count: number

}

export type ContentDocument = mongoose.HydratedDocument<Content>

@Schema({
  timestamps: true,
  toJSON: {
    transform: (doc: ContentDocument, ret: any) => {

      ret.id = ret._id?.toString() || ''
      delete ret._id
      delete ret.__v
      if (ret.raw)
        delete ret.raw

      ret.createdAt = ret.createdAt.toISOString()
      ret.updatedAt = ret.updatedAt.toISOString()

      if (ret.userId)
        ret.userId = ret.userId.toString()
      if (ret.contributorId)
        ret.contributorId = ret.contributorId.toString()

      ret.lastEditedTime = ret.lastEditedTime.toISOString()
      if (ret.scheduledTime)
        ret.scheduledTime = ret.scheduledTime.toISOString()
      if (ret.publishedTime)
        ret.publishedTime = ret.publishedTime.toISOString()
      if (ret.failedTime)
        ret.failedTime = ret.failedTime.toISOString()

      return ret
    },
  }
})
export class Content {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null,
    description: '关联的userId，如为Null，表示为原始社媒内容',
  })
  userId?: string | null

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null
  })
  contributorId?: string | null

  @Prop({
    type: String,
    required: true,
    enum: SocialProvider,
    description: '内容提供者',
  })
  provider: SocialProvider

  @Prop({
    required: true,
    type: String,
    enum: ContentType,
    description: '内容的基本类型：帖子、评论或故事',
  })
  contentType: ContentType

  @Prop({
    required: true,
    type: Array<string>,
    minLength: 1,
    description: '内容包含的媒体类型或特殊属性',
  })
  contentAttributes: ContentAttribute[]

  @Prop({
    required: true,
    type: String,
    description: '原始内容',
  })
  originalContent: string

  @Prop({
    type: String,
    description: '生成的内容',
  })
  aiGeneratedContent?: string

  @Prop({
    type: String,
    description: '外部内容ID',
  })
  rawId?: string

  @Prop({
    required: true,
    type: Metrics,
    description: '平台特定指标'
  })
  metrics: Metrics

  @Prop({
    required: true,
    type: PublicMetrics,
    description: '社媒平台通用互动指标，跨平台统一'
  })
  publicMetrics: PublicMetrics

  @Prop({
    type: mongoose.Schema.Types.Mixed,
    description: '平台原始内容'
  })
  raw: any

  @Prop({
    type: String,
    enum: ContentStatus,
    default: ContentStatus.DRAFT,
  })
  status: ContentStatus

  // draft状态的最后编辑时间
  @Prop({
    type: Date,
    required: true,
    default: Date.now,
  })
  lastEditedTime: Date

  // scheduled状态的发布时间
  @Prop({
    type: Date,
  })
  scheduledTime?: Date

  // published状态的发布时间
  @Prop({
    type: Date,
  })
  publishedTime?: Date

  // failed状态的发布时间
  @Prop({
    type: Date,
  })
  failedTime?: Date

  // 状态变更原因
  @Prop({
    type: String,
  })
  statusReason?: string
}

export const ContentSchema = SchemaFactory.createForClass(Content)

// 创建索引
ContentSchema.index({ userId: 1 }, { partialFilterExpression: { userId: { $ne: null } } })
ContentSchema.index({ userId: 1, provider: 1 }, { partialFilterExpression: { userId: { $ne: null } } })
ContentSchema.index({ userId: 1, contentType: 1, contentAttributes: 1 }, { partialFilterExpression: { userId: { $ne: null } } })
ContentSchema.index({ contributorId: 1 }, { partialFilterExpression: { contributorId: { $ne: null } } })
ContentSchema.index({ contributorId: 1, provider: 1 }, { partialFilterExpression: { contributorId: { $ne: null } } })
ContentSchema.index({ contributorId: 1, contentType: 1, contentAttributes: 1 }, { partialFilterExpression: { contributorId: { $ne: null } } })
ContentSchema.index({ contentType: 1 })
ContentSchema.index({ contentAttributes: 1 })
ContentSchema.index({ provider: 1 })
ContentSchema.index({ contentType: 1, contentAttributes: 1 })
ContentSchema.index({ rawId: 1 }, { partialFilterExpression: { rawId: { $ne: null } } })
ContentSchema.index({ status: 1 })
ContentSchema.index({ createdAt: -1 })
ContentSchema.index({ 'metrics.anonComments': -1 })
ContentSchema.index({ 'publicMetrics.retweet_count': -1 })
ContentSchema.index({ 'publicMetrics.reply_count': -1 })
ContentSchema.index({ 'publicMetrics.like_count': -1 })
ContentSchema.index({ 'publicMetrics.quote_count': -1 })
ContentSchema.index({ 'publicMetrics.bookmark_count': -1 })
ContentSchema.index({ 'publicMetrics.impression_count': -1 })

