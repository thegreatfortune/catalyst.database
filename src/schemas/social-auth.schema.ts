import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import mongoose from "mongoose"
import { SocialProvider } from "./user.schema"


export type SocialAuthDocument = mongoose.HydratedDocument<SocialAuth>

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
            return ret
        },
    },
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
        type: String
    })
    accessToken?: string

    @Prop({
        type: String
    })
    refreshToken?: string

    @Prop({
        type: Date
    })
    tokenExpiry?: Date

    @Prop({
        type: String
    })
    scope?: string
}
export const SocialAuthSchema = SchemaFactory.createForClass(SocialAuth)
// 添加复合索引以优化查询
SocialAuthSchema.index({ userId: 1, provider: 1 })