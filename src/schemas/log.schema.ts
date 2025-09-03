import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Schema as MongooseSchema } from 'mongoose'
import { SocialProvider } from './user.schema'


export type SocialOperationLogDocument = SocialOperationLog & Document

export enum SocialOperationType {
    TWEET = 'tweet',
    REPLY = 'reply',
    LIKE = 'like',
    RETWEET = 'retweet',
    DELETE = 'delete',
}

export enum SocialOperationStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    FAILED = 'failed',
    COMPENSATED = 'compensated',
}

@Schema({
    timestamps: true
})
export class SocialOperationContent {
    @Prop()
    text?: string

    @Prop([String])
    mediaIds?: string[]

    @Prop()
    inReplyToTweetId?: string

    @Prop()
    replySettings?: string

    @Prop({ type: MongooseSchema.Types.Mixed })
    additionalData?: Record<string, any>
}

@Schema()
export class SocialOperationResult {
    @Prop({ required: true })
    success: boolean

    @Prop()
    tweetId?: string

    @Prop()
    error?: string

    @Prop({ type: MongooseSchema.Types.Mixed })
    data?: Record<string, any>
}

@Schema()
export class SocialOperationCompensation {
    @Prop({ required: true, default: false })
    attempted: boolean

    @Prop()
    success?: boolean

    @Prop()
    error?: string

    @Prop()
    attemptedAt?: Date
}

@Schema({
    timestamps: true,
    collection: 'social_operation_logs',
})
export class SocialOperationLog {
    @Prop({ required: true })
    userId: string

    @Prop({ required: true, enum: SocialOperationType })
    operationType: SocialOperationType

    @Prop({ required: true, enum: SocialProvider })
    provider: SocialProvider

    @Prop({ required: true, enum: SocialOperationStatus, default: SocialOperationStatus.PENDING })
    status: SocialOperationStatus

    @Prop({ type: SocialOperationContent })
    content: SocialOperationContent

    @Prop({ type: SocialOperationResult })
    result?: SocialOperationResult

    @Prop({ type: SocialOperationCompensation })
    compensation?: SocialOperationCompensation

    @Prop({ default: 0 })
    retryCount: number

    @Prop()
    completedAt?: Date

    @Prop()
    anonymous?: boolean
}

export const SocialOperationLogSchema = SchemaFactory.createForClass(SocialOperationLog)

// 创建索引
SocialOperationLogSchema.index({ userId: 1, createdAt: -1 })
SocialOperationLogSchema.index({ status: 1, createdAt: 1 })
SocialOperationLogSchema.index({ 'result.tweetId': 1 })
SocialOperationLogSchema.index({ provider: 1, operationType: 1 })