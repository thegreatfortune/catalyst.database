import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { ClientSession, Model } from 'mongoose'
import { Point, PointDocument, PointTransaction, TransactionType, TransactionTypePoint } from '../schemas/point.schema'
import { UpdatePointDto } from './dto/create-point-transaction.dto'
import { Logger } from '@nestjs/common'
import { GetPointTransactionsDto, SortOrder } from './dto/get-point-transactions.dto'
import { GetPointTransactionsResponseDto } from './dto/get-point-transactions-response.dto'
import { InsufficientPointsException } from './exceptions/insufficient-points.exception'

@Injectable()
export class PointService {
    private readonly logger = new Logger(PointService.name)
    constructor(
        @InjectModel(Point.name) private pointModel: Model<Point>,
        @InjectModel(PointTransaction.name) private pointTransactionModel: Model<PointTransaction>,
    ) { }

    async upsertPoint(updatePointDto: UpdatePointDto, session?: ClientSession): Promise<Point> {
        try {

            const { userId, transactionType } = updatePointDto
            const pointsChange = TransactionTypePoint[transactionType]
            const currentPoint = await this.pointModel.findOne({ userId }, null, { session }).exec()

            if (pointsChange < 0 && (!currentPoint || currentPoint.points < Math.abs(pointsChange))) {
                throw new InsufficientPointsException(Math.abs(pointsChange), currentPoint ? currentPoint.points : 0)
            }

            // 执行更新操作
            const point = await this.pointModel.findOneAndUpdate(
                { userId },
                {
                    $inc: {
                        points: pointsChange,
                        count: 1
                    }
                },
                {
                    new: true,
                    upsert: true,
                    setDefaultsOnInsert: true,
                    session
                }
            ).exec()

            await this.createPointTransaction({ ...updatePointDto, balanceAfter: point.points }, session)

            return point.toJSON()
        } catch (error) {
            this.logger.error('Failed to upsert points', error)
            throw error
        }
    }

    async getPointTransaction(id: string): Promise<PointTransaction> {
        try {
            const pointTransaction = await this.pointTransactionModel.findById(id).exec()
            if (!pointTransaction) {
                throw new NotFoundException(`Points transaction not found with id ${id}`)
            }
            return pointTransaction.toJSON()
        } catch (error) {
            this.logger.error('Failed to get points transaction', error)
            throw error
        }
    }

    async getPointTransactions(gptDto: GetPointTransactionsDto): Promise<GetPointTransactionsResponseDto> {
        try {
            const { userId, transactionType, page = 1, limit = 10, sortOrder = SortOrder.DESC, sortBy = 'createdAt' } = gptDto
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
            const total = await this.pointTransactionModel.countDocuments(query).exec()

            // 查询当前页数据
            const pointTransactions = await this.pointTransactionModel
                .find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .exec()

            // 计算总页数
            const totalPages = Math.ceil(total / limit)

            // 构建分页响应
            const response: GetPointTransactionsResponseDto = {
                items: pointTransactions.map(pt => pt.toJSON()),
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

    private async createPointTransaction(updatePointDto: UpdatePointDto, session?: ClientSession): Promise<PointTransaction> {
        try {
            const pointTransaction = new PointTransaction()
            pointTransaction.userId = updatePointDto.userId
            pointTransaction.pointsChange = TransactionTypePoint[updatePointDto.transactionType]
            pointTransaction.transactionType = updatePointDto.transactionType
            pointTransaction.reason = updatePointDto.reason
            pointTransaction.balanceAfter = updatePointDto.balanceAfter
            pointTransaction.resourceTraded = updatePointDto.resourceTraded

            // 处理 relatedEntities 的类型转换
            if (updatePointDto.relatedEntities && updatePointDto.relatedEntities.length > 0) {
                pointTransaction.relatedEntities = updatePointDto.relatedEntities.map(entity => ({
                    type: entity.type,
                    relatedId: entity.relatedId
                }))
            } else {
                pointTransaction.relatedEntities = []
            }

            const createdPointTransaction = new this.pointTransactionModel(pointTransaction)

            // 使用事务保存
            if (session) {
                await createdPointTransaction.save({ session })
            } else {
                await createdPointTransaction.save()
            }

            return createdPointTransaction.toJSON()
        } catch (error) {
            this.logger.error('Failed to create points transaction', error)
            throw error
        }
    }
}
