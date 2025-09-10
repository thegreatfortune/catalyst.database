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
            // 1. 检查已有的匿名身份
            const currentIdentities = await this.anonymousIdentityModel.find({
                userId: new Types.ObjectId(uaiDto.userId),
                isDeleted: false
            }, null, { session }).exec()


            // 2. 检查提交的匿名身份中是否有多个活跃状态
            const activeSubmittedIdentities = uaiDto.anonymousIdentities.filter(identity => identity.isActive)
            if (activeSubmittedIdentities.length > 1) {
                throw new BadRequestException('只能有一个匿名身份处于活跃状态')
            }

            // 3. 准备更新和新增的数组
            const toUpdate: mongoose.AnyBulkWriteOperation<AnonymousIdentity>[] = []
            const toInsert: Partial<AnonymousIdentity>[] = []

            // 4. 如果提交了新的活跃身份，需要将当前活跃身份设为非活跃
            if (activeSubmittedIdentities.length > 0) {
                const currentActiveIdentity = currentIdentities.find(identity => identity.isActive)
                if (currentActiveIdentity) {
                    // 检查当前活跃身份是否在提交列表中
                    const submittedCurrentActive = uaiDto.anonymousIdentities.find(
                        identity => identity.id === currentActiveIdentity.id
                    )

                    // 如果当前活跃身份不在提交列表中，或者在提交列表中但不再活跃，则更新为非活跃
                    if (!submittedCurrentActive || !submittedCurrentActive.isActive) {
                        toUpdate.push({
                            updateOne: {
                                filter: { _id: currentActiveIdentity._id },
                                update: { $set: { isActive: false } }
                            }
                        })
                    }
                }
            }

            // 5. 处理提交的身份列表
            const currentIdentityIds = new Set(currentIdentities.map(identity => identity.id))

            for (const submittedIdentity of uaiDto.anonymousIdentities) {
                if (submittedIdentity.id && currentIdentityIds.has(submittedIdentity.id)) {
                    // 已存在的身份，需要更新
                    const { id, ...updateData } = submittedIdentity
                    toUpdate.push({
                        updateOne: {
                            filter: { _id: new Types.ObjectId(id) },
                            update: {
                                $set: { ...updateData }
                            }
                        }
                    })
                } else {
                    const { id, ...insertData } = submittedIdentity
                    // 新增的身份
                    toInsert.push({
                        ...insertData,
                        userId: uaiDto.userId
                    })
                }
            }


            // 6. 执行批量更新
            if (toUpdate.length > 0) {
                await this.anonymousIdentityModel.bulkWrite(toUpdate, { session })
            }

            // 7. 执行批量新增
            if (toInsert.length > 0) {
                await this.anonymousIdentityModel.insertMany(toInsert, { session })
            }

            // 8. 获取更新后的记录
            const updatedIdentities = await this.anonymousIdentityModel.find({
                userId: new Types.ObjectId(uaiDto.userId),
                isDeleted: false  // 只返回未删除的身份
            }, null, { session }).sort({ createdAt: -1 }).exec()  // 按创建时间降序排序

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
