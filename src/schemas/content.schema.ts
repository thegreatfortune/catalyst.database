// src/schemas/content.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { SocialProvider } from './user.schema'
import mongoose from 'mongoose'

export enum ContentStatus {
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

export class PublicMetrics {
  @Prop({ type: Number, default: 0, description: '点赞数' })
  likes: number

  @Prop({ type: Number, default: 0, description: '分享数' })
  shares: number

  @Prop({ type: Number, default: 0, description: '评论数' })
  comments: number

  @Prop({ type: Number, default: 0, description: '浏览数' })
  views: number

  @Prop({ type: Number, default: 0, description: '收藏数' })
  saves: number

  @Prop({ type: Date, default: Date.now, description: '最后更新时间' })
  lastUpdated: Date
}

export type ContentDocument = mongoose.HydratedDocument<Content>

@Schema({
  timestamps: true,
  toJSON: {
    transform: (doc: ContentDocument, ret: any) => {

      ret.id = ret._id?.toString() || ''
      delete ret._id
      delete ret.__v
      ret.createdAt = ret.createdAt?.toISOString()
      ret.updatedAt = ret.updatedAt?.toISOString()

      ret.userId = ret.userId.toString()
      ret.miningUserId = ret.miningUserId.toString()
      ret.parentId = ret.parentId?.toString()
      ret.rootId = ret.rootId?.toString()
      ret.lastEditedTime = ret.lastEditedTime?.toISOString()
      ret.scheduledTime = ret.scheduledTime?.toISOString()
      ret.publishedTime = ret.publishedTime?.toISOString()
      ret.failedTime = ret.failedTime?.toISOString()
      if (ret.metrics?.lastUpdated) {
        ret.metrics.lastUpdated = ret.metrics.lastUpdated.toISOString()
      }
      if (ret.providerData?.twitter?.threadTweets) {
        ret.providerData.twitter.threadTweets = ret.providerData.twitter.threadTweets.map((tweet: any) => ({
          ...tweet,
          tweetId: tweet.tweetId?.toString(),
        }))
      }
      return ret
    },
  }
})
export class Content {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  })
  userId: string

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  })
  miningUserId: string

  @Prop({
    type: Boolean,
    default: true,
    description: '是否为原生内容'
  })
  isNative: boolean

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
    type: String,
    required: true,
    enum: SocialProvider,
    description: '内容提供者',
  })
  provider: SocialProvider

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
  generatedContent?: string

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    description: '父内容',
  })
  parentId?: Content

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    description: '根内容',
  })
  rootId?: Content

  @Prop({
    type: Number,
    default: 0,
    min: 0,
    description: '内容等级'
  })
  contentLevel: number

  @Prop({
    type: String,
    description: '外部内容ID',
  })
  providerContentId?: string

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
    type: Object,
    description: '平台特定指标'
  })
  providerData: {
    twitter?: {
      tweetThreadId?: string // 保留作为主推文ID
      threadTweets?: {
        // 新增：存储线程中所有推文
        tweetId: string
        position: number // 在线程中的位置
        content?: string // 可选存储内容副本
        platformMetrics?: {
          // 平台特定指标，改名以区分通用指标
          likes: number
          retweets: number
          quotes: number
          replies: number
          impressions: number // Twitter特有
        }
        status: string // 发布状态
      }[]
      pollOptions?: string[]
      sensitiveContent?: boolean
      metrics?: {
        // Twitter平台特定指标
        likes: number
        retweets: number
        quotes: number
        replies: number
        impressions: number
      }
    }
    instagram?: {
      carousel?: boolean
      filters?: string[]
      location?: Record<string, any>
      taggedUsers?: string[]
      metrics?: {
        // Instagram平台特定指标
        likes: number
        comments: number
        saves: number
        shares: number
        reach: number
        impressions: number
        storyReplies?: number
        storyTaps?: number
        storyExits?: number
      }
    }
    rednote?: {
      topics?: string[]
      goodsLinks?: string[]
      collectionId?: string
      metrics?: {
        // 红薯平台特定指标
        likes: number
        comments: number
        collects: number
        shares: number
        views: number
      }
    }
    facebook?: {
      privacy?: string
      feelingActivity?: Record<string, any>
      taggedPeople?: string[]
      metrics?: {
        // Facebook平台特定指标
        reactions: {
          like: number
          love: number
          haha: number
          wow: number
          sad: number
          angry: number
          care: number
        }
        comments: number
        shares: number
        reach: number
        engagement: number
      }
    }
  }

  // @Prop({ type: [Object] })
  // media: {
  //   type: string
  //   url: string
  //   storageProvider: string
  //   originalFilename: string
  //   mimeType: string
  //   size: number
  //   dimensions?: {
  //     width: number
  //     height: number
  //   }
  //   duration?: number
  //   thumbnailUrl?: string
  //   alt?: string
  //   metadata?: Record<string, any>
  //   status: string
  //   createdAt: Date
  // }[]

  // @Prop({ type: Object })
  // analysis: {
  //   sentiment?: string
  //   topics?: string[]
  //   keywords?: string[]
  //   contentQuality?: {
  //     score: number
  //     feedback: string
  //   }
  //   moderationResults?: {
  //     flags: string[]
  //     safetyScore: number
  //   }
  // }

  // @Prop({ type: [Object] })
  // versions: {
  //   content: string
  //   timestamp: Date
  //   reason: string
  //   generatedBy: string
  // }[]

  @Prop({
    type: String,
    enum: ContentStatus,
    default: ContentStatus.DRAFT,
  })
  status: ContentStatus

  // draft状态的最后编辑时间
  @Prop({
    type: Date,
    default: Date.now,
  })
  lastEditedTime?: Date

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
ContentSchema.index({ userId: 1 })
ContentSchema.index({ contentType: 1 })
ContentSchema.index({ contentAttributes: 1 })
ContentSchema.index({ provider: 1 })
ContentSchema.index({ parentId: 1 })
ContentSchema.index({ rootId: 1 })
ContentSchema.index({ userId: 1, contentType: 1 })
ContentSchema.index({ userId: 1, provider: 1 })
ContentSchema.index({ contentType: 1, contentAttributes: 1 })
ContentSchema.index({ providerContentId: 1 })
ContentSchema.index({ status: 1 })
ContentSchema.index({ createdAt: -1 })
ContentSchema.index({ 'metrics.likes': -1 })
ContentSchema.index({ 'metrics.shares': -1 })
ContentSchema.index({ 'metrics.comments': -1 })
ContentSchema.index({ 'metrics.views': -1 })
ContentSchema.index({ 'metrics.saves': -1 })


