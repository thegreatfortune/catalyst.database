import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { ClientSession, Model, Types } from 'mongoose'
import { Credit, CreditTransaction, TransactionFlow, TransactionTypeCreditChange } from '../schemas/credit.schema'

import { Logger } from '@nestjs/common'
import { GetCreditTransactionsDto, SortOrder } from './dto/get-credit-transactions.dto'
import { GetCreditTransactionsResponseDto } from './dto/get-credit-transactions-response.dto'
import { InsufficientCreditsException } from './exceptions/insufficient-credits.exception'
import { UpdateFreePostDto } from 'src/user/dto/update-freepost.dto'
import { UpdateCreditDto } from './dto/update-credit.dto'

@Injectable()
export class CreditService {
    private readonly logger = new Logger(CreditService.name)
    constructor(
        @InjectModel(Credit.name) private creditModel: Model<Credit>,
        @InjectModel(CreditTransaction.name) private creditTransactionModel: Model<CreditTransaction>,
    ) { }

    async create(userId: string, session?: ClientSession): Promise<Credit> {
        try {

            const createdCredit = new this.creditModel({
                userId,
                balance: 0,
                acquiredCount: 0,
                consumedCount: 0,
                freePosts: []
            })
            await createdCredit.save({ session })

            return createdCredit.toJSON()
        } catch (error) {
            this.logger.error('创建用户失败', error)
            throw error
        }
    }

    async update(ucDto: UpdateCreditDto, session?: ClientSession): Promise<Credit> {
        try {
            const { userId, transactionType } = ucDto
            const creditChange = TransactionTypeCreditChange[transactionType]
            const currentCredit = await this.creditModel.findOne({ userId }, null, { session }).exec()

            if (creditChange < 0 && (!currentCredit || currentCredit.balance < Math.abs(creditChange))) {
                throw new InsufficientCreditsException(Math.abs(creditChange), currentCredit ? currentCredit.balance : 0)
            }

            // 根据积分变化类型更新不同的计数器
            const updateOperation: any = {
                $inc: {
                    balance: creditChange
                }
            }

            // 如果是获取积分，增加acquiredCount；如果是消耗积分，增加consumedCount
            if (creditChange > 0) {
                updateOperation.$inc.acquiredCount = 1
            } else {
                updateOperation.$inc.consumedCount = 1
            }

            const credit = await this.creditModel.findOneAndUpdate(
                { userId: new Types.ObjectId(userId) },
                updateOperation,
                {
                    new: true,
                    upsert: true,
                    setDefaultsOnInsert: true,
                    session
                }
            ).exec()

            await this.createCreditTransaction({ ...ucDto, balanceAfter: credit.balance }, session)

            return credit.toJSON()
        } catch (error) {
            this.logger.error('Failed to update credits', error)
            throw error
        }
    }

    async findByUserId(userId: string, session?: ClientSession): Promise<Credit> {
        try {
            const credit = await this.creditModel.findOne({ userId: new Types.ObjectId(userId) }, null, { session }).exec()
            return credit ? credit.toJSON() : { userId, balance: 0, acquiredCount: 0, consumedCount: 0, freePosts: [] }
        } catch (error) {
            this.logger.error('Failed to get credit', error)
            throw error
        }
    }

    async updateFreePosts(ufpDto: UpdateFreePostDto, session?: ClientSession): Promise<string[]> {
        const { userId, expiryTime } = ufpDto
        try {
            const userIdAsObjectId = new Types.ObjectId(userId)

            // 1. 使用 $pull 原子性地移除所有早于 expiryTime 的记录
            const updatedCredit = await this.creditModel.findOneAndUpdate(
                { userId: userIdAsObjectId },
                {
                    $pull: {
                        // 在这里，我们将 expiryTime 转换为字符串进行比较
                        freePosts: {
                            $lt: expiryTime.toISOString(),
                        },
                    },
                },
                { new: true, session }
            ).exec()
            if (!updatedCredit) {
                throw new NotFoundException('Not found credit!')
            }

            // 2. 检查清理后的数组长度，判断是否还有额度
            if (updatedCredit.freePosts.length >= 3) {
                // 已达到上限，不插入新记录
                throw new Error('Maximum free posts reached within the time window.')
            }

            // 3. 如果还有额度，使用 $push 插入新的时间戳字符串
            const finalCredit = await this.creditModel.findOneAndUpdate(
                { userId: userIdAsObjectId },
                { $push: { freePosts: new Date().toISOString() } },
                { new: true, session }
            ).exec()
            if (!finalCredit) {
                throw new NotFoundException('Not found credit!')
            }

            return finalCredit.toJSON().freePosts
        } catch (error) {
            this.logger.error('Failed to update free posts', error)
            throw error
        }
    }

    async findFreePostsByUserId(userId: string, session?: ClientSession): Promise<string[]> {
        try {
            const credit = await this.creditModel.findOne({ userId }, null, { session }).exec()
            if (!credit) {
                throw new NotFoundException('Not found credit!')
            }
            return credit ? credit.toJSON().freePosts : []
        } catch (error) {
            this.logger.error('Failed to get credit', error)
            throw error
        }
    }

    async findCreditTransactionsByUserId(userId: string, session?: ClientSession): Promise<CreditTransaction[]> {
        try {
            const creditTransactions = await this.creditTransactionModel.find({ userId }, null, { session }).exec()
            return creditTransactions.map(ct => ct.toJSON())
        } catch (error) {
            this.logger.error('Failed to get credit transactions', error)
            throw error
        }
    }

    async findCreditTransactionById(id: string): Promise<CreditTransaction> {
        try {
            const creditTransaction = await this.creditTransactionModel.findById(id).exec()
            if (!creditTransaction) {
                throw new NotFoundException(`Credit transaction not found with id ${id}`)
            }
            return creditTransaction.toJSON()
        } catch (error) {
            this.logger.error('Failed to get credit transaction', error)
            throw error
        }
    }

    async findCreditTransactions(gctDto: GetCreditTransactionsDto): Promise<GetCreditTransactionsResponseDto> {
        try {
            const { userId, transactionType, page = 1, limit = 10, sortOrder = SortOrder.DESC, sortBy = 'createdAt' } = gctDto
            const skip = (page - 1) * limit

            // 构建排序条件
            const sort: Record<string, 1 | -1> = {}
            sort[sortBy] = sortOrder === SortOrder.ASC ? 1 : -1


            // 构建动态查询条件
            const query: Record<string, any> = { userId }
            if (transactionType) {
                query.transactionType = transactionType
            }

            // 查询总数
            const total = await this.creditTransactionModel.countDocuments(query).exec()

            // 查询当前页数据
            const creditTransactions = await this.creditTransactionModel
                .find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .exec()

            // 计算总页数
            const totalPages = Math.ceil(total / limit)

            // 构建分页响应
            const response: GetCreditTransactionsResponseDto = {
                items: creditTransactions.map(ct => ct.toJSON()),
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

    private async createCreditTransaction(ucDto: UpdateCreditDto, session?: ClientSession): Promise<CreditTransaction> {
        try {
            const creditTransaction = new CreditTransaction()
            creditTransaction.userId = ucDto.userId
            creditTransaction.change = TransactionTypeCreditChange[ucDto.transactionType]
            creditTransaction.transactionFlow = TransactionTypeCreditChange[ucDto.transactionType] > 0 ? TransactionFlow.INCOME : TransactionFlow.OUTCOME
            creditTransaction.transactionType = ucDto.transactionType
            creditTransaction.reason = ucDto.reason
            creditTransaction.balanceAfter = ucDto.balanceAfter
            creditTransaction.resourceTraded = ucDto.resourceTraded

            // 处理 relatedEntities 的类型转换
            if (ucDto.relatedEntities && ucDto.relatedEntities.length > 0) {
                creditTransaction.relatedEntities = ucDto.relatedEntities.map(entity => ({
                    type: entity.type,
                    relatedId: entity.relatedId
                }))
            } else {
                creditTransaction.relatedEntities = []
            }

            const createdCreditTransaction = new this.creditTransactionModel(creditTransaction)

            // 使用事务保存
            if (session) {
                await createdCreditTransaction.save({ session })
            } else {
                await createdCreditTransaction.save()
            }

            return createdCreditTransaction.toJSON()
        } catch (error) {
            this.logger.error('Failed to create credit transaction', error)
            throw error
        }
    }
}
