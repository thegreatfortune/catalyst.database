import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose from 'mongoose'

export type CreditDocument = mongoose.HydratedDocument<Credit>

@Schema({
    timestamps: true,
    toJSON: {
        transform: (_: CreditDocument, ret: any) => {
            delete ret._id
            delete ret.__v
            delete ret.userId
            delete ret.createdAt
            delete ret.updatedAt
            return ret
        },
    },
})
export class Credit {
    @Prop({
        required: true,
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // 引用 User 模型
        index: true, // 为查询优化添加索引
        description: '用户 ID'
    })
    userId: string

    @Prop({
        required: true,
        type: Number,
        min: 0,
        default: 0,
        description: '积分值'
    })
    balance: number

    @Prop({
        required: true,
        type: Number,
        min: 0,
        default: 0,
        description: '获取积分总和'
    })
    totalAcquired: number

    @Prop({
        required: true,
        type: Number,
        min: 0,
        default: 0,
        description: '消耗积分总和'
    })
    totalConsumed: number

    @Prop({
        required: true,
        type: Number,
        min: 0,
        default: 0,
        description: '获取积分次数'
    })
    acquiredCount: number

    @Prop({
        required: true,
        type: Number,
        min: 0,
        default: 0,
        description: '消耗积分次数'
    })
    consumedCount: number

    @Prop({
        type: [String],
        default: [],
        description: '免费发帖数组，表示24小时内可发免费推的数量，内部保存时间戳',
        validate: [
            (val: string[]) => val.length <= 3,
            'The array `freePosts` cannot have more than 3 items.'
        ],
    })
    freePosts: string[]
}

export const CreditSchema = SchemaFactory.createForClass(Credit)
 