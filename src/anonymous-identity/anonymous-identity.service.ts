import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { InjectConnection, InjectModel } from '@nestjs/mongoose'
import mongoose, { ClientSession, Connection, Model, Types } from 'mongoose'
import { AnonymousIdentity, AnonymousIdentityDocument } from '../schemas/anonymout-identity.schema'
import { UpdateAnonymousIdentityDto } from './dto/update-anonymous-identity.dto'
import { CreditService } from 'src/credit/credit.service'
import { AddAnonymousIdentityDto } from './dto/add-anonymous-identity.dto'
import { TransactionFlow, TransactionType, TransactionTypeCreditChange } from '../schemas/credit.schema'

@Injectable()
export class AnonymousIdentityService {
    private readonly logger = new Logger(AnonymousIdentityService.name)
    constructor(
        @InjectModel(AnonymousIdentity.name) private anonymousIdentityModel: Model<AnonymousIdentity>,
        @InjectConnection() private connection: Connection,
        private readonly creditService: CreditService,
    ) { }

    async findByUserId(userId: string): Promise<AnonymousIdentity[]> {
        try {
            return await this.anonymousIdentityModel.find({
                userId: new Types.ObjectId(userId),
                isDeleted: false
            }).sort({ createdAt: -1 }).exec()
        } catch (error) {
            this.logger.error(`获取用户 ${userId} 的匿名身份失败`, error)
            throw error
        }
    }

    async count(userId: string, session?: ClientSession): Promise<number> {
        try {
            return this.anonymousIdentityModel.countDocuments({
                userId: new Types.ObjectId(userId),
                isDeleted: false
            }, { session }).exec()
        } catch (error) {
            this.logger.error(`获取用户 ${userId} 的匿名身份失败`, error)
            throw error
        }
    }

    async add(aaiDto: AddAnonymousIdentityDto): Promise<AnonymousIdentity> {
        const { userId, anonymousIdentity } = aaiDto
        const session = await this.connection.startSession()
        session.startTransaction()
        try {

            const count = await this.count(userId)
            console.log('count', count)
            if (count > 0) {
                const credit = await this.creditService.findByUserId(userId, session)

                if (credit.balance < TransactionTypeCreditChange.BUY_ANON_ID) {
                    throw new Error('积分不足')
                }

                await this.creditService.update({
                    userId,
                    transactionType: TransactionType.BUY_ANON_ID,
                    reason: 'Buy anonymous identity'
                }, session)
            }

            const newIdentity = new this.anonymousIdentityModel({
                ...anonymousIdentity,
                userId: new Types.ObjectId(userId),
                isActive: false,
                isDeleted: false
            })

            await newIdentity.save({ session })
            await session.commitTransaction()

            return newIdentity.toJSON()
        } catch (error) {
            await session.abortTransaction()
            this.logger.error(`添加用户 ${userId} 的匿名身份失败`, error)
            throw error
        } finally {
            await session.endSession()
        }
    }

    async update(uaiDto: UpdateAnonymousIdentityDto) {
        const session = await this.connection.startSession()
        session.startTransaction()
        try {
            // 准备批量操作数组
            const bulkOps: mongoose.AnyBulkWriteOperation<AnonymousIdentity>[] = []

            // 处理提交的身份列表
            for (const submittedIdentity of uaiDto.anonymousIdentities) {
                const { id, ...updateData } = submittedIdentity

                if (id) {
                    // 已有ID的情况，使用updateOne
                    bulkOps.push({
                        updateOne: {
                            filter: { _id: new Types.ObjectId(id) },
                            update: { $set: { ...updateData } }
                        }
                    })
                } else {
                    // 没有ID的情况，使用upsert
                    bulkOps.push({
                        updateOne: {
                            filter: { _id: new Types.ObjectId() },
                            update: {
                                $set: {
                                    ...updateData,
                                    userId: new Types.ObjectId(uaiDto.userId),
                                    isDeleted: updateData.isDeleted ?? false,
                                    preferences: updateData.preferences ?? []
                                }
                            },
                            upsert: true
                        }
                    })
                }
            } 

            // 执行批量操作
            if (bulkOps.length > 0) {
                await this.anonymousIdentityModel.bulkWrite(bulkOps, { session })
            }

            // 获取更新后的记录
            const updatedIdentities = await this.anonymousIdentityModel.find({
                userId: new Types.ObjectId(uaiDto.userId),
                isDeleted: false
            }, null, { session }).sort({ createdAt: -1 }).exec()

            await session.commitTransaction()

            return updatedIdentities.map(identity => identity.toJSON())
        } catch (error) {
            await session.abortTransaction()
            this.logger.error(`更新用户 ${uaiDto.userId} 的匿名身份失败`, error)
            throw error
        } finally {
            await session.endSession()
        }
    }
}
