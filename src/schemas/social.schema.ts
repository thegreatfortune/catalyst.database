import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import mongoose from "mongoose"
import { SocialProvider } from "./user.schema"


export type SocialDocument = mongoose.HydratedDocument<Social>


export class Metrics {
    @Prop({
        type: Number,
        required: true,
        min: 0,
    })
    followers: number

    @Prop({
        type: Number,
        required: true,
        min: 0,
    })
    following: number

    @Prop({
        type: Number,
        required: true,
        min: 0,
    })
    totalPosts: number
}

@Schema({
    timestamps: true,
    toJSON: {
        transform: (_: SocialDocument, ret: any) => {

            ret.id = ret._id?.toString() || ''
            delete ret._id
            delete ret.__v
            ret.createdAt = ret.createdAt?.toISOString()
            ret.updatedAt = ret.updatedAt?.toISOString()

            ret.userId = ret.userId.toString()

            return ret
        },
    },
})
export class Social {

    @Prop({
        required: true,
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
        description: '用户 ID'
    })
    userId: string

    @Prop({
        type: String,
        enum: SocialProvider,
        required: true,
    })
    provider: SocialProvider

    @Prop({
        type: String,
        required: true,
    })
    accountId: string

    @Prop({
        type: String,
        required: true,
    })
    username: string

    @Prop({
        type: String
    })
    displayName?: string

    @Prop({
        type: String
    })
    profileUrl?: string

    @Prop({
        type: Metrics,
        required: true,
    })
    metrics: Metrics

    @Prop({
        type: Date,
        required: true,
    })
    lastSyncedAt: Date

    @Prop({
        type: Boolean,
        required: true,
    })
    isConnected: boolean
}
export const SocialSchema = SchemaFactory.createForClass(Social)

// 添加复合索引以优化查询
SocialSchema.index({ userId: 1, provider: 1 })