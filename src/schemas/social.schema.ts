import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import mongoose from "mongoose"
import { SocialProvider } from "./user.schema"
import { UserV2 as XUserType } from 'twitter-api-v2'
import { IsEnum, IsNotEmpty, IsNumber, IsString, ValidateNested } from "class-validator"
import { Type } from "class-transformer"

export type SocialDocument = mongoose.HydratedDocument<Social>

export enum XVerifiedType {
    NONE = 'none',
    BLUE = 'blue',
    BUSINESS = 'business',
    GOVERNMENT = 'government',
}

export class XPublicMetrics {
    @Prop({
        type: Number,
        required: true,
        min: 0,
    })
    followers_count: number

    @Prop({
        type: Number,
        required: true,
        min: 0,
    })
    following_count: number

    @Prop({
        type: Number,
        required: true,
        min: 0,
    })
    tweet_count: number

    @Prop({
        type: Number,
        required: true,
        min: 0,
    })
    @IsNumber()
    @IsNotEmpty()
    listed_count: number

    @Prop({
        type: Number,
        required: true,
        min: 0,
    })
    like_count: number

    @Prop({
        type: Number,
        required: true,
        min: 0,
    })
    media_count: number
}

@Schema({ _id: false })
export class XUser implements Pick<XUserType,
    'id' | 'username' | 'name' | 'description' | 'location' | 'public_metrics' | 'url' | 'confirmed_email' |
    'verified' | 'verified_type' | 'entities' | 'profile_image_url' | 'profile_banner_url' |
    'created_at' | 'most_recent_tweet_id' | 'protected' | 'pinned_tweet_id'
> {
    @Prop({
        type: String,
        required: true,
    })
    id: string

    @Prop({
        type: String,
        required: true,
    })
    username: string

    @Prop({
        type: String,
        required: true,
    })
    name: string

    @Prop({
        type: String,
    })
    confirmed_email: string

    @Prop({
        type: String,
        required: true,
    })
    description: string

    @Prop({
        type: String
    })
    location: string

    @Prop({
        type: XPublicMetrics,
        required: true,
    })
    public_metrics: XPublicMetrics

    @Prop({
        type: String
    })
    url: string

    @Prop({
        type: Boolean
    })
    verified: boolean

    @Prop({
        type: String
    })
    verified_type: XVerifiedType

    @Prop({
        type: Object
    })
    entities: any

    @Prop({
        type: String
    })
    profile_image_url: string

    @Prop({
        type: String
    })
    profile_banner_url: string

    @Prop({
        type: String,
        required: true,
    })
    created_at: string

    @Prop({
        type: String
    })
    most_recent_tweet_id: string

    @Prop({
        type: Boolean
    })
    protected: boolean

    @Prop({
        type: String
    })
    pinned_tweet_id: string
}


@Schema({
    timestamps: true,
    toJSON: {
        transform: (_: SocialDocument, ret: any) => {
            delete ret._id
            delete ret.__v
            ret.createdAt = ret.createdAt.toISOString()
            ret.updatedAt = ret.updatedAt.toISOString()

            if (ret.userId) {
                ret.userId = ret.userId.toString()
            }

            delete ret.details.id
            delete ret.details.confirmed_email
            delete ret.details.entities
            delete ret.details.created_at
            delete ret.details.protected

            return ret
        },
    },
    discriminatorKey: 'provider'
})
export class Social {
    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
        description: '用户 ID，为null表示未绑定',
        required: false,
        default: null
    })
    userId: string | null

    @Prop({
        type: String,
        enum: SocialProvider,
        required: true,
    })
    provider: SocialProvider

    @Prop({
        type: mongoose.Schema.Types.Mixed,
        description: '平台用户原始数据',
        required: true,
    })
    details: XUser
}
export const SocialSchema = SchemaFactory.createForClass(Social)

export const XUserSchema = SchemaFactory.createForClass(XUser)

// // 添加复合索引以优化查询
// SocialSchema.index({ userId: 1, provider: 1 })

// 添加社交媒体ID唯一索引
SocialSchema.index({ 'details.id': 1, provider: 1 }, { unique: true })

// 添加用户绑定索引
SocialSchema.index({ userId: 1, provider: 1 }, {
    partialFilterExpression: { userId: { $ne: null } }
})

SocialSchema.discriminator(`social_${SocialProvider.X}`, new mongoose.Schema({
    details: { type: XUserSchema, required: true }
}))