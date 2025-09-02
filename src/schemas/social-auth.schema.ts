import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import mongoose from "mongoose"
import { SocialProvider } from "./user.schema"
import { IsDate, IsNotEmpty, IsString } from "class-validator"
import { Type } from "class-transformer"


export type SocialAuthDocument = mongoose.HydratedDocument<SocialAuth>
export type XAuthDocument = mongoose.HydratedDocument<XAuth>

@Schema({
    _id: false,
    toJSON: {
        transform: (_: XAuthDocument, ret: any) => {
            ret.tokenExpiry = ret.tokenExpiry.toISOString()
            return ret
        }
    }
})
export class XAuth {
    @Prop({
        type: String,
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    accessToken: string

    @Prop({
        type: String,
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    refreshToken: string

    @Prop({
        type: Date,
        required: true,
    })
    @IsDate()
    @IsNotEmpty()
    @Type(() => Date)
    tokenExpiry: Date

    @Prop({
        type: String,
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    scope: string
}

@Schema({
    timestamps: true,
    collection: 'social_auths',
    toJSON: {
        transform: (_: SocialAuthDocument, ret: any) => {

            ret.id = ret._id?.toString() || ''
            delete ret._id
            delete ret.__v
            ret.createdAt = ret.createdAt?.toISOString()
            ret.updatedAt = ret.updatedAt?.toISOString()

            ret.userId = ret.userId.toString()
            if (ret.scope) {
                ret.scope = (ret.scope as string).split(',')
            }
            if (ret.tokenExpiry) {
                ret.tokenExpiry = ret.tokenExpiry.toISOString()
            }
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