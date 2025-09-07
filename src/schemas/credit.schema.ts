import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose from 'mongoose'

export type CreditDocument = mongoose.HydratedDocument<Credit>
export type CreditTransactionDocument = mongoose.HydratedDocument<CreditTransaction>
export type RelatedEntityDocument = mongoose.HydratedDocument<RelatedEntity>

export enum TransactionFlow {
    INCOME = 'INCOME',
    OUTCOME = 'OUTCOME'
}

// 定义交易类型枚举
export enum TransactionType {
    BIND_V1 = 'BIND_V1',         // 绑定社交媒体账号
    BIND_V2 = 'BIND_V2',         // 绑定社交媒体账号
    BIND_V3 = 'BIND_V3',
    POST = 'POST',         // 提交
    REPLY = 'REPLY',       // 评论
    AI = 'AI',             // AI使用
    BUY_ANON_ID = 'BUY_ANON_ID',

    CONTRIBUTE_POST = 'CONTRIBUTE_POST', // 贡献发帖
    CONTRIBUTE_REPLY = 'CONTRIBUTE_REPLY', // 贡献评论
    CONTRIBUTE_GET = 'CONTRIBUTE_GET', // 贡献获取

    BUY = 'BUY', // 购买积分
}

export const TransactionTypeCreditChange = {
    BIND_V1: 100,
    BIND_V2: 300,
    BIND_V3: 800,
    POST: -8,
    REPLY: -2,
    AI: -2,
    BUY_ANON_ID: -10,

    CONTRIBUTE_POST: 20,
    CONTRIBUTE_REPLY: 10,
    CONTRIBUTE_GET: 10,

    BUY: -100,
}

export enum RelatedEntityType {
    CONTENT = 'content',
    USER = 'user',
}

@Schema({
    timestamps: true,
    _id: false,
    toJSON: {
        transform: (_: RelatedEntityDocument, ret: any) => {
            delete ret.__v
            ret.createdAt = ret.createdAt?.toISOString()
            ret.updatedAt = ret.updatedAt?.toISOString()

            ret.relatedId = ret.relatedId.toString()
            return ret
        }
    }
})
export class RelatedEntity {
    @Prop({
        required: true,
        type: String,
        enum: RelatedEntityType,
        description: '关联实体的类型',
    })
    type: RelatedEntityType

    @Prop({
        required: true,
        type: mongoose.Schema.Types.ObjectId,
        description: '关联实体的 ID（优先使用 ObjectId）',
    })
    relatedId: string
}


@Schema({
    timestamps: true,
    collection: 'credit_transactions',
    toJSON: {
        transform: (_: CreditTransactionDocument, ret: any) => {

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
export class CreditTransaction {
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
        index: true, // 为统计优化添加索引
        description: '积分变化值（正数为产出，负数为消耗）'
    })
    change: number

    @Prop({
        required: true,
        type: String,
        enum: TransactionFlow,
        description: '积分变动流向',
    })
    transactionFlow: TransactionFlow


    @Prop({
        required: true,
        type: String,
        enum: TransactionType,
        description: '积分变动类型',
    })
    transactionType: TransactionType

    @Prop({
        type: String,
        description: '变动原因（例如“购买积分”、“挖矿奖励”）',
    })
    reason?: string

    @Prop({
        type: Number,
        description: '变动后的积分余额',
    })
    balanceAfter?: number

    @Prop({
        type: String,
        description: '消耗时交易的资源或商品 ID',
    })
    resourceTraded?: string

    @Prop({
        type: [RelatedEntity],
        description: '关联的实体（内容、用户等）',
    })
    relatedEntities?: Array<RelatedEntity>
}

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
export const CreditTransactionSchema = SchemaFactory.createForClass(CreditTransaction)
export const RelatedEntitySchema = SchemaFactory.createForClass(RelatedEntity)

// 添加复合索引以优化查询
CreditTransactionSchema.index({ userId: 1, createdAt: -1 }) // 按用户和时间排序
CreditTransactionSchema.index({ userId: 1, transactionType: 1 }) // 按用户和交易类型排序
CreditTransactionSchema.index({ transactionType: 1 }) // 按交易类型查询