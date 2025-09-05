import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose from 'mongoose'

export type PointDocument = mongoose.HydratedDocument<Point>
export type PointTransactionDocument = mongoose.HydratedDocument<PointTransaction>
export type RelatedEntityDocument = mongoose.HydratedDocument<RelatedEntity>

// 定义交易类型枚举
export enum TransactionType {
    BIND = 'bind',         // 绑定社交媒体账号

    POST = 'post',         // 提交
    REPLY = 'reply',   // 评论

    GET = 'get',           // 获取

    ANON_COMMENT = 'anonComment', // 匿名评论
    ANON_POST = 'anonPost', // 匿名发帖

    BUY = 'buy', // 购买积分

    AI = 'ai', // AI使用
}

export enum TransactionTypePoint {
    BIND = 1,
    POC = 1,
    POC_FEE = 1,

    ANON_COMMENT = -1,
    ANON_POST = -10,
    BUY = -100,
    AIPOST = -100,
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
    collection: 'point_transactions',
    toJSON: {
        transform: (_: PointTransactionDocument, ret: any) => {

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
export class PointTransaction {
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
    pointsChange: number

    @Prop({
        required: true,
        type: String,
        enum: TransactionType,
        description: '积分变动类型：产出（purchase, mining, bonus）或消耗（redeem, trade）',
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
        transform: (_: PointDocument, ret: any) => {

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
export class Point {
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
    points: number

    @Prop({
        required: true,
        type: Number,
        min: 0,
        default: 0,
        description: '积分变化次数'
    })
    count: number
}


export const PointSchema = SchemaFactory.createForClass(Point)
export const PointTransactionSchema = SchemaFactory.createForClass(PointTransaction)
export const RelatedEntitySchema = SchemaFactory.createForClass(RelatedEntity)

// 添加复合索引以优化查询
PointTransactionSchema.index({ userId: 1, createdAt: -1 }) // 按用户和时间排序
PointTransactionSchema.index({ userId: 1, transactionType: 1 }) // 按用户和交易类型排序
PointTransactionSchema.index({ transactionType: 1 }) // 按交易类型查询