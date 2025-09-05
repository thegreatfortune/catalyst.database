import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import mongoose from "mongoose"
import { SocialProvider } from "./user.schema"
import { IsDate, IsNotEmpty, IsString } from "class-validator"
import { Type } from "class-transformer"


export type SocialAuthDocument = mongoose.HydratedDocument<SocialAuth>
export type XAuthDocument = mongoose.HydratedDocument<XAuth>

@Schema({ _id: false })
export class XAuth {
    @Prop({
        type: String,
        required: true,
    })
    accessToken: string

    @Prop({
        type: String,
        required: true,
    })
    refreshToken: string

    @Prop({
        type: Date,
        required: true,
    })
    tokenExpiry: Date

    @Prop({
        type: String,
        required: true,
    })
    scope: string
}

@Schema({
    timestamps: true,
    collection: 'social_auths',
    toJSON: {
        transform: (_: SocialAuthDocument, ret: any) => {
            delete ret._id
            delete ret.__v
            ret.createdAt = ret.createdAt?.toISOString()
            ret.updatedAt = ret.updatedAt?.toISOString()
            ret.details.tokenExpiry = ret.details.tokenExpiry.toISOString()
            ret.details.scope = ret.details.scope.split(',')
            return ret
        },
    },
    discriminatorKey: 'provider'
})
export class SocialAuth {
    @Prop({
        required: true,
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
        description: '用户 ID'
    })
    userId: string

    @Prop({
        required: true,
        type: String,
        enum: SocialProvider,
    })
    provider: SocialProvider


    @Prop({
        required: true,
        type: Date,
    })
    lastUsedAt: Date

    @Prop({
        type: mongoose.Schema.Types.Mixed,
        description: '平台用户原始Auth数据',
        required: true,
    })
    details: XAuth
}
export const SocialAuthSchema = SchemaFactory.createForClass(SocialAuth)
export const XAuthSchema = SchemaFactory.createForClass(XAuth)
// 添加复合索引以优化查询
SocialAuthSchema.index({ userId: 1, provider: 1 })

SocialAuthSchema.discriminator(`social_auth_${SocialProvider.X}`, new mongoose.Schema({
    details: { type: XAuthSchema, required: true }
}))