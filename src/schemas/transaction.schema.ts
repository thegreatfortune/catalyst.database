import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose from 'mongoose'

export type TransactionDocument = mongoose.HydratedDocument<Transaction>
export type AccountChangeDocument = mongoose.HydratedDocument<AccountChange>
export type RelatedEntityDocument = mongoose.HydratedDocument<RelatedEntity>

export enum TransactionFlow {
    INCOME = 'INCOME',
    OUTCOME = 'OUTCOME'
}

// 操作类型枚举（所有可能的操作类型）
export enum OperationType {
    // 资金特有操作
    DEPOSIT = 'DEPOSIT',           // 充值
    WITHDRAW = 'WITHDRAW',         // 提现
    // TRANSFER_IN = 'TRANSFER_IN',   // 转入
    // TRANSFER_OUT = 'TRANSFER_OUT', // 转出

    // 积分特有操作
    BIND_V1 = 'BIND_V1',           // 绑定社交媒体账号
    BIND_V2 = 'BIND_V2',
    BIND_V3 = 'BIND_V3',
    BUY = 'BUY',                   // 购买积分

    // 共享操作类型
    POST = 'POST',                 // 提交
    REPLY = 'REPLY',               // 评论
    AI = 'AI',                     // AI使用
    BUY_ANON_ID = 'BUY_ANON_ID',
    CONTRIBUTE_POST = 'CONTRIBUTE_POST',
    CONTRIBUTE_REPLY = 'CONTRIBUTE_REPLY',
    CONTRIBUTE_GET = 'CONTRIBUTE_GET',
    CONTRIBUTE_MEDIA_UPLOAD = 'CONTRIBUTE_MEDIA_UPLOAD',
}

export const OperationTypeChangeAmount = {
    // 资金特有操作
    DEPOSIT: 100,
    WITHDRAW: -100,

    // 积分特有操作
    BIND_V1: 100,
    BIND_V2: 300,
    BIND_V3: 800,
    BUY: -100,

    // 共享操作类型
    POST: -8,
    REPLY: -2,
    AI: -2,
    BUY_ANON_ID: -10,
    CONTRIBUTE_POST: 20,
    CONTRIBUTE_REPLY: 10,
    CONTRIBUTE_GET: 10,
    CONTRIBUTE_MEDIA_UPLOAD: 10,


}



// 账户类型
export enum AccountType {
    FUNDS = 'FUNDS',
    CREDIT = 'CREDIT',
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


// 账户变动子文档
@Schema({
    _id: false,
    timestamps: false,
})
export class AccountChange {
    @Prop({
        required: true,
        type: String,
        enum: AccountType,
        description: '账户类型',
    })
    accountType: AccountType

    @Prop({
        required: true,
        type: Number,
        description: '变动金额',
    })
    changeAmount: number

    @Prop({
        required: true,
        type: String,
        enum: TransactionFlow,
        description: '变动流向',
    })
    transactionFlow: TransactionFlow

    @Prop({
        type: Number,
        description: '变动后余额',
    })
    balanceAfter?: number
}

// 主交易记录
@Schema({
    timestamps: true,
    collection: 'transactions',
    toJSON: {
        transform: (_: TransactionDocument, ret: any) => {
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
export class Transaction {
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
        enum: OperationType,
        description: '操作类型',
        index: true,
    })
    operationType: OperationType

    @Prop({
        required: true,
        type: [AccountChange],
        description: '账户变动记录',
        validate: [
            (val: AccountChange[]) => val.length >= 1,
            '交易必须至少包含一个账户变动'
        ],
    })
    accountChanges: AccountChange[]

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

    // @Prop({
    //     type: String,
    //     description: '交易状态（如pending, completed, failed）',
    // })
    // status?: string

    @Prop({
        type: [RelatedEntity],
        description: '关联的实体（内容、用户等）',
    })
    relatedEntities?: Array<RelatedEntity>
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction)

// 添加复合索引以优化查询
TransactionSchema.index({ userId: 1, createdAt: -1 })
TransactionSchema.index({ userId: 1, operationType: 1 })
TransactionSchema.index({ 'accountChanges.accountType': 1 })
TransactionSchema.index({ transactionHash: 1 }, { sparse: true })
TransactionSchema.index({ status: 1 })