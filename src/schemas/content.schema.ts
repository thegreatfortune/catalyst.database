// src/schemas/content.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from './user.schema';
import mongoose from 'mongoose';

export type ContentDocument = mongoose.HydratedDocument<Content>;

@Schema({ timestamps: true })
export class Content {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId: User;

  @Prop({
    required: true,
    enum: ['post', 'comment', 'story'],
    description: '内容的基本类型：帖子、评论或故事',
  })
  contentType: string;

  @Prop({
    type: [String],
    enum: ['text', 'image', 'video', 'audio', 'poll', 'link', 'thread'],
    description: '内容包含的媒体类型或特殊属性',
  })
  contentAttributes: string[];

  @Prop({ required: true })
  platform: string;

  @Prop()
  originalQuery: string;

  @Prop()
  generatedContent: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Content' })
  parentId: Content;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Content' })
  rootId: Content;

  @Prop({ default: 0 })
  contentLevel: number;

  @Prop()
  externalId: string;

  @Prop()
  externalUrl: string;

  @Prop({ type: Object, description: '通用互动指标，跨平台统一' })
  metrics: {
    likes: number; // 所有平台的点赞总数
    shares: number; // 所有平台的分享/转发总数
    comments: number; // 所有平台的评论总数
    views: number; // 所有平台的浏览总数
    saves: number; // 所有平台的收藏总数
    engagement: number; // 总互动数（可以是上述指标的总和）
    lastUpdated: Date; // 最后更新时间
  };

  @Prop({ type: Object })
  platformData: {
    twitter?: {
      tweetThreadId?: string; // 保留作为主推文ID
      threadTweets?: {
        // 新增：存储线程中所有推文
        tweetId: string;
        position: number; // 在线程中的位置
        content?: string; // 可选存储内容副本
        platformMetrics?: {
          // 平台特定指标，改名以区分通用指标
          likes: number;
          retweets: number;
          quotes: number;
          replies: number;
          impressions: number; // Twitter特有
        };
        status: string; // 发布状态
      }[];
      pollOptions?: string[];
      sensitiveContent?: boolean;
      metrics?: {
        // Twitter平台特定指标
        likes: number;
        retweets: number;
        quotes: number;
        replies: number;
        impressions: number;
      };
    };
    instagram?: {
      carousel?: boolean;
      filters?: string[];
      location?: Record<string, any>;
      taggedUsers?: string[];
      metrics?: {
        // Instagram平台特定指标
        likes: number;
        comments: number;
        saves: number;
        shares: number;
        reach: number;
        impressions: number;
        storyReplies?: number;
        storyTaps?: number;
        storyExits?: number;
      };
    };
    rednote?: {
      topics?: string[];
      goodsLinks?: string[];
      collectionId?: string;
      metrics?: {
        // 红薯平台特定指标
        likes: number;
        comments: number;
        collects: number;
        shares: number;
        views: number;
      };
    };
    facebook?: {
      privacy?: string;
      feelingActivity?: Record<string, any>;
      taggedPeople?: string[];
      metrics?: {
        // Facebook平台特定指标
        reactions: {
          like: number;
          love: number;
          haha: number;
          wow: number;
          sad: number;
          angry: number;
          care: number;
        };
        comments: number;
        shares: number;
        reach: number;
        engagement: number;
      };
    };
  };

  @Prop({ type: [Object] })
  media: {
    type: string;
    url: string;
    storageProvider: string;
    originalFilename: string;
    mimeType: string;
    size: number;
    dimensions?: {
      width: number;
      height: number;
    };
    duration?: number;
    thumbnailUrl?: string;
    alt?: string;
    metadata?: Record<string, any>;
    status: string;
    createdAt: Date;
  }[];

  @Prop({ type: Object })
  analysis: {
    sentiment?: string;
    topics?: string[];
    keywords?: string[];
    contentQuality?: {
      score: number;
      feedback: string;
    };
    moderationResults?: {
      flags: string[];
      safetyScore: number;
    };
  };

  @Prop({ type: [Object] })
  versions: {
    content: string;
    timestamp: Date;
    reason: string;
    generatedBy: string;
  }[];

  @Prop({
    default: 'draft',
    enum: ['draft', 'published', 'scheduled', 'failed'],
  })
  status: string;

  // draft状态的最后编辑时间
  @Prop()
  lastEditedTime: Date;

  // scheduled状态的发布时间
  @Prop()
  scheduledTime: Date;

  // published状态的发布时间
  @Prop()
  publishedTime: Date;

  // failed状态的发布时间
  @Prop()
  failedTime: Date;

  // 状态变更原因
  @Prop()
  statusReason: string;
}

export const ContentSchema = SchemaFactory.createForClass(Content);

// 创建索引
ContentSchema.index({ userId: 1 });
ContentSchema.index({ contentType: 1 });
ContentSchema.index({ contentAttributes: 1 });
ContentSchema.index({ platform: 1 });
ContentSchema.index({ parentId: 1 });
ContentSchema.index({ rootId: 1 });
ContentSchema.index({ userId: 1, contentType: 1 });
ContentSchema.index({ userId: 1, platform: 1 });
ContentSchema.index({ contentType: 1, contentAttributes: 1 });
ContentSchema.index({ externalId: 1 });
ContentSchema.index({ status: 1 });
ContentSchema.index({ createdAt: -1 });
ContentSchema.index({ 'metrics.likes': -1 });
ContentSchema.index({ 'metrics.comments': -1 });
ContentSchema.index({ 'metrics.shares': -1 });
ContentSchema.index({ 'metrics.views': -1 });
ContentSchema.index({ 'metrics.engagement': -1 });
