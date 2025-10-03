import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common'
import { InjectConnection, InjectModel } from '@nestjs/mongoose'
import { Connection, Model, ClientSession } from 'mongoose'
import { DepositDto } from './dto/deposit.dto'
import { WithdrawDto } from './dto/withdraw.dto'
import { TransferDto } from './dto/transfer.dto'
import { Funds } from '../schemas/funds.schema'

import { UpdateFundsDto } from './dto/update-funds.dto'
import { Types } from 'mongoose'
import { InsufficientFundsException } from './exceptions/insufficient-funds.exception'
import { ConfigService } from '../config/config.service'
import { OperationType, OperationTypeChangeAmount } from '../schemas/transaction.schema'
import { TransactionService } from '../transaction/transaction.service'

@Injectable()
export class FundsService {
    private readonly logger = new Logger(FundsService.name)
    constructor(
        @InjectModel(Funds.name) private fundsModel: Model<Funds>,
        @InjectConnection() private connection: Connection,
        private readonly configService: ConfigService,
        private readonly transactionService: TransactionService,
    ) { }

    async create(userId: string, withdrawAddress: string, session?: ClientSession): Promise<Funds> {
        try {
            // 创建资金账户
            const createdFunds = new this.fundsModel({
                userId,
                balance: 0,
                acquiredCount: 0,
                consumedCount: 0,
                totalAcquired: 0,
                totalConsumed: 0,
                totalDeposit: 0,
                totalDepositCount: 0,
                totalWithdraw: 0,
                totalWithdrawCount: 0,
                withdrawAddress,
            })

            await createdFunds.save({ session })
            return createdFunds.toJSON()
        } catch (error) {
            this.logger.error('Failed to create funds', error)
            throw error
        }
    }

    async getFunds(userId: string) {
        const funds = await this.fundsModel.findOne({ userId })
        if (!funds) {
            throw new NotFoundException(`用户 ${userId} 的资金账户不存在`)
        }
        return funds
    }

    async deposit(depositDto: DepositDto) {
        const { userId, amount, transactionHash } = depositDto
        const session = await this.connection.startSession()
        session.startTransaction()

        try {
            // 检查外部交易ID是否已存在
            if (transactionHash) {
                const existingTransaction = await this.transactionService.getTransactionByHash(transactionHash, session)
                if (existingTransaction) {
                    throw new BadRequestException(`Transaction ID ${transactionHash} already exists`)
                }
            }

            // 检查金额是否有效
            if (amount <= 0) {
                throw new BadRequestException('Deposit amount must be greater than 0')
            }

            // 使用$inc操作符直接更新余额和总充值金额
            const updatedFunds = await this.fundsModel.findOneAndUpdate(
                { userId },
                {
                    $inc: {
                        balance: amount,
                        totalDeposit: amount,
                        totalDepositCount: 1
                    }
                },
                { new: true, session },
            )

            // 检查是否找到并更新了资金账户
            if (!updatedFunds) {
                throw new NotFoundException(`Failed to find funds for user ${userId}`)
            }

            // 创建交易记录
            await this.transactionService.create({
                userId,
                operationType: OperationType.DEPOSIT,
                fundsBalanceAfter: updatedFunds.balance,
                transactionHash,
            }, session)

            // 提交事务
            await session.commitTransaction()

            return {
                success: true,
                balance: updatedFunds.balance,
            }
        } catch (error) {
            this.logger.error('Failed to deposit funds', error)
            // 回滚事务
            await session.abortTransaction()
            throw error
        } finally {
            // 结束会话
            session.endSession()
        }
    }

    async withdraw(withdrawDto: WithdrawDto) {
        const { userId, amount, withdrawAddress, transactionHash } = withdrawDto
        const session = await this.connection.startSession()
        session.startTransaction()

        try {
            // 检查外部交易ID是否已存在
            if (transactionHash) {
                const existingTransaction = await this.transactionService.getTransactionByHash(transactionHash, session)
                if (existingTransaction) {
                    throw new BadRequestException(`Transaction ID ${transactionHash} already exists`)
                }
            }

            // 检查金额是否有效
            if (amount <= 0) {
                throw new BadRequestException('Withdrawal amount must be greater than 0')
            }

            // 使用条件更新确保余额充足
            const updatedFunds = await this.fundsModel.findOneAndUpdate(
                { userId, balance: { $gte: amount } }, // 添加条件：余额必须大于等于提现金额
                {
                    $inc: {
                        balance: -amount,
                        totalWithdraw: amount,
                        totalWithdrawCount: 1,
                    },
                    ...(withdrawAddress ? { $set: { withdrawAddress: withdrawAddress } } : {})
                },
                { new: true, session }
            )

            // 如果没有找到符合条件的文档，说明余额不足或用户不存在
            if (!updatedFunds) {
                // 检查用户是否存在
                const userExists = await this.fundsModel.findOne({ userId }, null, { session })
                if (!userExists) {
                    throw new NotFoundException(`Failed to find funds for user ${userId}`)
                } else {
                    throw new BadRequestException('Insufficient funds')
                }
            }

            // 创建交易记录
            await this.transactionService.create({
                userId,
                operationType: OperationType.WITHDRAW,
                fundsBalanceAfter: updatedFunds.balance,
                transactionHash,
            }, session)

            // 提交事务
            await session.commitTransaction()

            return {
                success: true,
                balance: updatedFunds.balance,
            }
        } catch (error) {
            this.logger.error('Failed to withdraw funds', error)
            // 回滚事务
            await session.abortTransaction()
            throw error
        } finally {
            // 结束会话
            session.endSession()
        }
    }

    // async transfer(transferDto: TransferDto) {
    //     const { fromUserId, toUserId, amount, reason } = transferDto
    //     const session = await this.connection.startSession()
    //     session.startTransaction()

    //     try {
    //         // 检查发送方资金账户是否存在
    //         const fromFunds = await this.fundsModel.findOne({ userId: fromUserId }, session)
    //         if (!fromFunds) {
    //             throw new NotFoundException(`用户 ${fromUserId} 的资金账户不存在`)
    //         }

    //         // 检查接收方资金账户是否存在
    //         const toFunds = await this.fundsModel.findOne({ userId: toUserId }, session)
    //         if (!toFunds) {
    //             throw new NotFoundException(`用户 ${toUserId} 的资金账户不存在`)
    //         }

    //         // 检查金额是否有效
    //         if (amount <= 0) {
    //             throw new BadRequestException('转账金额必须大于0')
    //         }

    //         // 检查余额是否足够
    //         if (fromFunds.balance < amount) {
    //             throw new BadRequestException('资金余额不足')
    //         }

    //         // 更新发送方资金余额
    //         const newFromBalance = fromFunds.balance - amount
    //         await this.fundsModel.updateOne(
    //             { userId: fromUserId },
    //             { $set: { balance: newFromBalance } },
    //             session
    //         )

    //         // 更新接收方资金余额
    //         const newToBalance = toFunds.balance + amount
    //         await this.fundsModel.updateOne(
    //             { userId: toUserId },
    //             { $set: { balance: newToBalance } },
    //             session
    //         )

    //         // 创建发送方交易记录
    //         await this.transactionService.create({
    //             userId: fromUserId,
    //             operationType: OperationType.TRANSFER,
    //             fundsBalanceAfter: newFromBalance,
    //             status: 'completed',
    //             relatedEntities: [
    //                 {
    //                     type: 'user',
    //                     relatedId: toUserId,
    //                 },
    //             ],
    //         }, session)

    //         // 创建接收方交易记录
    //         await this.transactionService.create({
    //             userId: toUserId,
    //             changeAmount: amount, // 正数表示增加
    //             transactionFlow: TransactionFlow.INCOME,
    //             transactionType: FundsTransactionType.TRANSFER_IN,
    //             reason: reason || `来自用户 ${fromUserId} 的转账`,
    //             balanceAfter: newToBalance,
    //             status: 'completed',
    //             relatedEntities: [
    //                 {
    //                     type: 'user',
    //                     relatedId: fromUserId,
    //                 },
    //             ],
    //         }, session)

    //         // 提交事务
    //         await session.commitTransaction()

    //         return {
    //             success: true,
    //             fromBalance: newFromBalance,
    //             toBalance: newToBalance,
    //         }
    //     } catch (error) {
    //         this.logger.error(error)
    //         // 回滚事务
    //         await session.abortTransaction()
    //         throw error
    //     } finally {
    //         // 结束会话
    //         session.endSession()
    //     }
    // }

    /**
     * 更新用户资金，支持事务
     * @param ufDto 更新资金DTO
     * @param session 可选的数据库会话，用于事务
     * @returns 更新后的资金信息
     */
    async update(ufDto: UpdateFundsDto, session?: ClientSession): Promise<Funds> {
        try {
            const { userId, operationType } = ufDto
            const changeAmount = (operationType === OperationType.DEPOSIT ||
                operationType === OperationType.WITHDRAW)
                ? OperationTypeChangeAmount[operationType] * this.configService.fundRate / 100
                : OperationTypeChangeAmount[operationType]

            if (!changeAmount) {
                throw new BadRequestException(`无效的交易类型: ${operationType}`)
            }

            // 使用条件更新确保余额充足
            const updateOperation: any = {
                $inc: {
                    balance: changeAmount
                }
            }

            if (changeAmount > 0) {
                updateOperation.$inc.acquiredCount = 1
                updateOperation.$inc.totalAcquired = changeAmount
            } else if (changeAmount < 0) {
                updateOperation.$inc.consumedCount = 1
                updateOperation.$inc.totalConsumed = Math.abs(changeAmount)
            }

            // 更新资金信息（如果是减少资金，确保余额足够）
            const funds = await this.fundsModel.findOneAndUpdate(
                {
                    userId,
                    ...(changeAmount < 0 ? { balance: { $gte: Math.abs(changeAmount) } } : {})
                },
                updateOperation,
                {
                    new: true,
                    session
                }
            )

            // 如果没有找到符合条件的文档，说明余额不足或用户不存在
            if (!funds) {
                // 检查用户是否存在
                const userExists = await this.fundsModel.findOne({ userId }, null, { session })
                if (!userExists) {
                    throw new NotFoundException(`用户 ${userId} 的资金账户不存在`)
                } else {
                    throw new InsufficientFundsException(Math.abs(changeAmount), userExists.balance)
                }
            }

            return funds
        } catch (error) {
            this.logger.error('更新资金失败', error)
            throw error
        }
    }
}
