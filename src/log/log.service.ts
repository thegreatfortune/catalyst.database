import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import {
    SocialOperationLog,
    SocialOperationLogDocument,
    SocialOperationType,
    SocialOperationStatus,
    SocialOperationContent,
    SocialOperationResult,
    SocialOperationCompensation
} from '../schemas/log.schema'
import { SocialProvider } from '../schemas/user.schema'


@Injectable()
export class LogService {
    private readonly logger = new Logger(LogService.name)

    constructor(
        @InjectModel(SocialOperationLog.name)
        private socialOperationLogModel: Model<SocialOperationLogDocument>,
    ) { }

    /**
     * 创建社交操作日志
     */
    async createSocialOperationLog(
        userId: string,
        operationType: SocialOperationType,
        provider: SocialProvider,
        content: SocialOperationContent,
        anonymous: boolean = false,
    ): Promise<SocialOperationLogDocument> {
        try {
            const log = new this.socialOperationLogModel({
                userId,
                operationType,
                provider,
                status: SocialOperationStatus.PENDING,
                content,
                anonymous,
            })

            return await log.save()
        } catch (error) {
            this.logger.error(`创建社交操作日志失败: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 更新操作结果
     */
    async updateOperationResult(
        logId: string,
        result: SocialOperationResult,
        status: SocialOperationStatus = SocialOperationStatus.COMPLETED,
    ): Promise<SocialOperationLogDocument> {
        try {
            const update: any = { result, status }

            if (status === SocialOperationStatus.COMPLETED) {
                update.completedAt = new Date()
            }

            const updatedLog = await this.socialOperationLogModel.findByIdAndUpdate(
                logId,
                update,
                { new: true }
            )

            if (!updatedLog) {
                throw new NotFoundException(`未找到ID为 ${logId} 的操作日志`)
            }

            return updatedLog
        } catch (error) {
            this.logger.error(`更新操作结果失败: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 记录补偿操作
     */
    async recordCompensation(
        logId: string,
        compensation: SocialOperationCompensation,
    ): Promise<SocialOperationLogDocument> {
        try {
            compensation.attemptedAt = new Date()

            const updatedLog = await this.socialOperationLogModel.findByIdAndUpdate(
                logId,
                {
                    compensation,
                    status: compensation.success
                        ? SocialOperationStatus.COMPENSATED
                        : SocialOperationStatus.FAILED
                },
                { new: true }
            )

            if (!updatedLog) {
                throw new NotFoundException(`未找到ID为 ${logId} 的操作日志`)
            }

            return updatedLog
        } catch (error) {
            this.logger.error(`记录补偿操作失败: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 增加重试次数
     */
    async incrementRetryCount(logId: string): Promise<SocialOperationLogDocument> {
        try {
            const updatedLog = await this.socialOperationLogModel.findByIdAndUpdate(
                logId,
                { $inc: { retryCount: 1 } },
                { new: true }
            )

            if (!updatedLog) {
                throw new NotFoundException(`未找到ID为 ${logId} 的操作日志`)
            }

            return updatedLog
        } catch (error) {
            this.logger.error(`增加重试次数失败: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 查找未完成的操作
     */
    async findPendingOperations(
        limit: number = 10,
        skipMinutes: number = 5,
    ): Promise<SocialOperationLogDocument[]> {
        try {
            const cutoffTime = new Date(Date.now() - skipMinutes * 60 * 1000)

            return await this.socialOperationLogModel.find({
                status: SocialOperationStatus.PENDING,
                createdAt: { $lt: cutoffTime },
            })
                .sort({ createdAt: 1 })
                .limit(limit)
                .exec()
        } catch (error) {
            this.logger.error(`查找未完成操作失败: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 根据推文ID查找操作日志
     */
    async findByTweetId(tweetId: string): Promise<SocialOperationLogDocument | null> {
        try {
            return await this.socialOperationLogModel.findOne({
                'result.tweetId': tweetId
            }).exec()
        } catch (error) {
            this.logger.error(`根据推文ID查找操作日志失败: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 获取用户的操作历史
     */
    async getUserOperationHistory(
        userId: string,
        limit: number = 20,
        skip: number = 0,
    ): Promise<SocialOperationLogDocument[]> {
        try {
            return await this.socialOperationLogModel.find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec()
        } catch (error) {
            this.logger.error(`获取用户操作历史失败: ${error.message}`, error.stack)
            throw error
        }
    }
}
