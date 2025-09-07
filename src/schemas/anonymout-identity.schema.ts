import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import mongoose from "mongoose"

export type AnonymousIdentityDocument = mongoose.HydratedDocument<AnonymousIdentity>


@Schema({
    timestamps: true,
    collection: 'anonymous_identities',
    toJSON: {
        transform: (_: AnonymousIdentityDocument, ret: any) => {
            ret.id = ret._id?.toString() || ''
            delete ret._id
            delete ret.__v
            delete ret.userId
            delete ret.createdAt
            return ret
        },
    },
})
export class AnonymousIdentity {
    @Prop({
        required: true,
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
        description: '用户ID'
    })
    userId: string

    @Prop({
        type: String,
        required: true,
    })
    name: string

    @Prop({
        type: String,
        required: true,
    })
    avatar: string

    @Prop({
        type: Array<string>,
        required: true,
    })
    preferences?: string[]

    @Prop({
        type: Boolean,
        required: true,
    })
    isActive: boolean

    @Prop({
        type: Boolean,
        required: true,
    })
    isDeleted: boolean
}


export const AnonymousIdentitySchema = SchemaFactory.createForClass(AnonymousIdentity)