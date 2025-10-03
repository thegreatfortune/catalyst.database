import { Injectable } from '@nestjs/common'
import { ClientSession, Model } from 'mongoose'
import { GetTransactionsDto, SortOrder } from './dto/get-transactions.dto'
import { GetTransactionsResponseDto } from './dto/get-transactions-response.dto'
import { Transaction, TransactionDocument, AccountChange, OperationType, TransactionFlow, AccountType, OperationTypeChangeAmount } from '../schemas/transaction.schema'
import { Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { CreateTransactionDto } from './dto/create.dto'
import { ConfigService } from '../config/config.service'

@Injectable()
export class TransactionService {
    private readonly logger = new Logger(TransactionService.name)
    constructor(
        @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
        private configService: ConfigService
    ) { }


    async getTransactionsByUserId(gctDto: GetTransactionsDto, session?: ClientSession): Promise<GetTransactionsResponseDto> {
        try {
            const { operationType, page = 1, limit = 10, sortOrder = SortOrder.DESC, userId } = gctDto
            const skip = (page - 1) * limit

            // 构建排序条件
            const sort: Record<string, 1 | -1> = {}
            sort['createdAt'] = sortOrder === SortOrder.ASC ? 1 : -1


            // 构建动态查询条件
            const query: Record<string, any> = { userId }
            if (operationType) {
                query.operationType = operationType
            }

            // 查询总数
            const total = await this.transactionModel.countDocuments(query, { session }).exec()

            // 查询当前页数据
            const transactions = await this.transactionModel
                .find(query, { session })
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .exec()

            // 计算总页数
            const totalPages = Math.ceil(total / limit)

            // 构建分页响应
            const response: GetTransactionsResponseDto = {
                items: transactions.map(ct => ct.toJSON()),
                total,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }

            return response
        } catch (error) {
            this.logger.error('Failed to get points transactions by user id and transaction type', error)
            throw error
        }
    }

    async getTransactionByHash(transactionHash: string, session?: ClientSession): Promise<Transaction | null> {
        try {
            return await this.transactionModel.findOne({ transactionHash }, { session }).exec()
        } catch (error) {
            this.logger.error('Failed to get transaction by transaction hash', error)
            throw error
        }
    }

    /**
     * 创建交易记录
     * @param createDto 创建交易的数据
     * @param session 可选的数据库会话，用于事务
     * @returns 创建的交易记录
     */
    async create(createDto: CreateTransactionDto, session?: ClientSession): Promise<Transaction> {
        try {
            const { userId, operationType } = createDto
            this.logger.debug(`Creating transaction for user ${userId} with operation type ${operationType}`)

            // 根据操作类型获取变化金额
            const changeAmount = OperationTypeChangeAmount[createDto.operationType]
            if (changeAmount === undefined) {
                throw new Error(`未知的操作类型: ${createDto.operationType}`)
            }

            // 确定交易流向
            const transactionFlow = changeAmount > 0 ? TransactionFlow.INCOME : TransactionFlow.OUTCOME

            // 准备账户变更数组
            const accountChanges: AccountChange[] = []

            // 根据操作类型确定影响的账户类型
            // CREDIT 账户变更
            if ([
                OperationType.BIND_V1,
                OperationType.BIND_V2,
                OperationType.BIND_V3,
                OperationType.BUY,
                OperationType.POST,
                OperationType.REPLY,
                OperationType.AI,
                OperationType.BUY_ANON_ID,
                OperationType.CONTRIBUTE_POST,
                OperationType.CONTRIBUTE_REPLY,
                OperationType.CONTRIBUTE_GET,
                OperationType.CONTRIBUTE_MEDIA_UPLOAD
            ].includes(createDto.operationType)) {
                accountChanges.push({
                    accountType: AccountType.CREDIT,
                    changeAmount: changeAmount,
                    transactionFlow: transactionFlow,
                    balanceAfter: createDto.creditBalanceAfter
                })
            }

            // FUNDS 账户变更
            if ([
                OperationType.DEPOSIT,
                OperationType.WITHDRAW,
                OperationType.POST,
                OperationType.REPLY,
                OperationType.AI,
                OperationType.BUY_ANON_ID,
                OperationType.CONTRIBUTE_MEDIA_UPLOAD
            ].includes(createDto.operationType)) {
                accountChanges.push({
                    accountType: AccountType.FUNDS,
                    // 资金金额需要转换单位
                    changeAmount: operationType === OperationType.DEPOSIT ||
                        operationType === OperationType.WITHDRAW
                        ? changeAmount * this.configService.fundRate / 100
                        : changeAmount,
                    transactionFlow: transactionFlow,
                    balanceAfter: createDto.fundsBalanceAfter
                })
            }

            // 创建新的交易记录
            const transaction = new this.transactionModel({
                userId: createDto.userId,
                operationType: createDto.operationType,
                accountChanges: accountChanges,
                reason: createDto.reason,
                transactionHash: createDto.transactionHash,
                // status: createDto.status,
                relatedEntities: createDto.relatedEntities ?? []
            })

            // 使用事务保存
            if (session) {
                await transaction.save({ session })
            } else {
                await transaction.save()
            }

            return transaction
        } catch (error) {
            this.logger.error(`Failed to create transaction: ${error.message}`, error.stack)
            throw error
        }
    }
}
