import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose from 'mongoose'
import { RelatedEntity, RelatedEntityType, TransactionFlow } from './credit.schema'

export type FundsDocument = mongoose.HydratedDocument<Funds>
export type FundsTransactionDocument = mongoose.HydratedDocument<FundsTransaction>

// 定义资金交易类型枚举
export enum FundsTransactionType {
    DEPOSIT = 'DEPOSIT',           // 充值
    WITHDRAW = 'WITHDRAW',         // 提现

    POST = 'POST',         // 提交
    REPLY = 'REPLY',       // 评论
    AI = 'AI',             // AI使用
    BUY_ANON_ID = 'BUY_ANON_ID',

    CONTRIBUTE_POST = 'CONTRIBUTE_POST', // 贡献发帖
    CONTRIBUTE_REPLY = 'CONTRIBUTE_REPLY', // 贡献评论
    CONTRIBUTE_GET = 'CONTRIBUTE_GET', // 贡献获取
    CONTRIBUTE_MEDIA_UPLOAD = 'CONTRIBUTE_MEDIA_UPLOAD', // 贡献上传媒体

    TRANSFER_IN = 'TRANSFER_IN',   // 转入
    TRANSFER_OUT = 'TRANSFER_OUT', // 转出
}

export const FundsTransactionTypeChangeAmount = {
    POST: -8,
    REPLY: -2,
    AI: -2,
    BUY_ANON_ID: -10,

    CONTRIBUTE_POST: 20,
    CONTRIBUTE_REPLY: 10,
    CONTRIBUTE_GET: 10,
    CONTRIBUTE_MEDIA_UPLOAD: 10,

    DEPOSIT: 100,
    WITHDRAW: -100,
}

@Schema({
    timestamps: true,
    collection: 'funds_transactions',
    toJSON: {
        transform: (_: FundsTransactionDocument, ret: any) => {
            ret.id = ret._id?.toString() || ''
            delete ret._id
            delete ret.__v
            delete ret.userId
            ret.createdAt = ret.createdAt?.toISOString()
            ret.updatedAt = ret.updatedAt?.toISOString()

            return ret
        },
    },
})
export class FundsTransaction {
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
        description: '资金变化值（正数为增加，负数为减少），以整数形式存储（实际值 = 存储值 / 1000000）'
    })
    changeAmount: number

    @Prop({
        required: true,
        type: String,
        enum: TransactionFlow,
        description: '资金变动流向',
    })
    transactionFlow: TransactionFlow

    @Prop({
        required: true,
        type: String,
        enum: FundsTransactionType,
        description: '资金变动类型',
    })
    transactionType: FundsTransactionType

    @Prop({
        type: Number,
        description: '变动后的资金余额，以整数形式存储（实际值 = 存储值 / 1000000）'
    })
    balanceAfter?: number

    @Prop({
        type: String,
        description: '变动原因描述',
    })
    reason?: string


    @Prop({
        type: String,
        description: '交易的外部ID（如区块链交易哈希）',
    })
    transactionHash?: string

    @Prop({
        type: String,
        description: '交易状态（如pending, completed, failed）',
    })
    status?: string

    @Prop({
        type: [RelatedEntity],
        description: '关联的实体（内容、用户等）',
    })
    relatedEntities?: Array<RelatedEntity>
}

@Schema({
    timestamps: true,
    collection: 'funds',
    toJSON: {
        transform: (_: FundsDocument, ret: any) => {
            delete ret._id
            delete ret.__v
            delete ret.userId
            delete ret.createdAt
            delete ret.updatedAt
            return ret
        },
    },
})
export class Funds {
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
        description: 'USDT资金余额，以整数形式存储（实际值 = 存储值 / 1000000）'
    })
    balance: number

    @Prop({
        required: true,
        type: Number,
        min: 0,
        default: 0,
        description: '总充值金额，以整数形式存储（实际值 = 存储值 / 1000000）'
    })
    totalDeposit: number

    @Prop({
        required: true,
        type: Number,
        min: 0,
        default: 0,
        description: '总充值次数'
    })
    totalDepositCount: number

    @Prop({
        required: true,
        type: Number,
        min: 0,
        default: 0,
        description: '总提现金额，以整数形式存储（实际值 = 存储值 / 1000000）'
    })
    totalWithdraw: number

    @Prop({
        type: String,
        description: '默认提现地址',
        required: true
    })
    withdrawAddress: string
}

export const FundsSchema = SchemaFactory.createForClass(Funds)
export const FundsTransactionSchema = SchemaFactory.createForClass(FundsTransaction)

// 添加复合索引以优化查询
FundsTransactionSchema.index({ userId: 1, createdAt: -1 }) // 按用户和时间排序
FundsTransactionSchema.index({ userId: 1, transactionType: 1 }) // 按用户和交易类型排序
FundsTransactionSchema.index({ transactionType: 1 }) // 按交易类型查询
FundsTransactionSchema.index({ externalTransactionId: 1 }, { sparse: true }) // 按外部交易ID查询
FundsTransactionSchema.index({ status: 1 }) // 按状态查询
