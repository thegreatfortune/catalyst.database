import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectConnection, InjectModel } from '@nestjs/mongoose'
import { ClientSession, Connection, Model, Types } from 'mongoose'
import { Social, SocialDocument, XUser } from '../schemas/social.schema'
import { Logger } from '@nestjs/common'
import { CreateSocialDto } from './dto/create-social.dto'
import { GetSocialDto } from './dto/get-social.dto'
import { UpdateSocialDto } from './dto/update-social.dto'
import { CreateSocialAuthDto } from '../social-auth/dto/social-auth.dto'
import { User, UserDocument } from '../schemas/user.schema'
import { SocialAuthService } from '../social-auth/social-auth.service'
import { RemoveSocialDto } from './dto/remove-social.dto'

@Injectable()
export class SocialService {
    private readonly logger = new Logger(SocialService.name)
    constructor(
        @InjectModel(Social.name) private socialModel: Model<SocialDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectConnection() private connection: Connection,
        private readonly socialAuthService: SocialAuthService,
    ) { }

    /**
     * 绑定社交账号，或者重新绑定社交账号
     * @param csDto 创建社交账号DTO
     * @param csaDto 创建社交授权DTO
     * @returns 
     */
    async bindSocialAccount(
        csDto: CreateSocialDto,
        csaDto: CreateSocialAuthDto,
    ): Promise<User> {

        const userId = csDto.userId
        const provider = csDto.provider

        const session = await this.connection.startSession()
        session.startTransaction()

        try {
            // 查询用户
            const user = await this.userModel.findById(userId, null, { session }).exec()

            // 检查用户是否存在
            if (!user) {
                throw new NotFoundException(`User not found with id ${userId}`)
            }

            // 使用Promise.allSettled检查社交账号和授权信息是否存在
            const results = await Promise.allSettled([
                this.getSocial({ userId, provider }, session),
                this.socialAuthService.getSocialAuth({ userId, provider }, session)
            ])

            // 检查是否已经绑定了该社交账号
            const hasSocial = results[0].status === 'fulfilled'
            const hasSocialAuth = results[1].status === 'fulfilled'

            if (hasSocial || hasSocialAuth) {
                throw new BadRequestException(`User already has a ${provider} account bound`)
            }

            // 并行创建社交账号和授权信息
            await Promise.all([
                this.createSocial(csDto, session),
                this.socialAuthService.createSocialAuth(csaDto, session)
            ])

            // 提交事务
            await session.commitTransaction()

            return user.toJSON()
        } catch (error) {
            // 回滚事务
            await session.abortTransaction()
            this.logger.error(`Failed to bind social account for user ${userId} with provider ${provider}`, error)
            throw error
        } finally {
            // 结束会话
            session.endSession()
        }
    }

    /**
     * 解绑社交账号
     * @param rsDto 解绑社交账号DTO
     * @returns 
     */
    async unbindSocial(rsDto: RemoveSocialDto): Promise<Social> {
        const { userId, provider } = rsDto
        const session = await this.connection.startSession()
        session.startTransaction()
        try {

            const updatedSocialAccount = await this.socialModel.findOneAndUpdate(
                { userId, provider },
                { $set: { userId: null } },
                { new: true, session }
            ).exec()

            if (!updatedSocialAccount) {
                throw new NotFoundException(`No social account found for user ${userId} and provider ${provider}`)
            }

            await this.socialAuthService.removeSocialAuth(rsDto, session)

            await session.commitTransaction()
            return updatedSocialAccount.toJSON()
        } catch (error) {
            session.abortTransaction()
            this.logger.error(`Failed to remove social account for user ${rsDto.userId} and provider ${rsDto.provider}`, error)
            throw error
        } finally {
            session.endSession()
        }
    }


    /**
     * 更新社交账号，只负责更新社交账号信息
     * @param usDto 更新社交账号DTO
     * @param session 事务会话
     * @returns 更新后的社交账号
     */
    async updateSocial(usDto: UpdateSocialDto, session?: ClientSession): Promise<XUser> {
        const { provider, details } = usDto
        try {
            // 如果没有要更新的字段，抛出错误
            if (Object.keys(details).length === 0) {
                throw new BadRequestException('No fields to update')
            }

            // 只使用details.id和provider作为查询条件
            const query = { 'details.id': details.id, provider }

            this.logger.log(`Updating social account with query: ${JSON.stringify(query)} and updates: ${JSON.stringify(details)}`)

            // 执行更新操作
            const updatedSocialAccount = await this.socialModel.findOneAndUpdate(
                query,
                { $set: { details } },
                { new: true, session }
            ).exec()

            // 处理未找到账号的情况
            if (!updatedSocialAccount) {
                throw new NotFoundException(`No ${provider} account found with ID ${details.id}`)
            }

            return updatedSocialAccount.toJSON().details
        } catch (error) {
            this.logger.error(`Failed to update social account: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 获取社交账号
     * @param gsDto 获取社交账号DTO
     * @param session 事务会话
     * @returns 社交账号
     */
    async getSocial(gsDto: GetSocialDto, session?: ClientSession): Promise<XUser> {
        const { userId, provider } = gsDto
        try {
            // 直接查询指定用户和平台的社交账号
            const socialAccount = await this.socialModel.findOne(
                {
                    userId: new Types.ObjectId(userId),
                    provider: provider
                },
                null,
                { session }
            ).exec()

            if (!socialAccount) {
                throw new NotFoundException(`No ${provider} account found for user ${userId}`)
            }

            return socialAccount.toJSON().details
        } catch (error) {
            this.logger.error(`Failed to get social account for user ${userId} and provider ${provider}`, error)
            throw error
        }
    }



    /**
 * 创建社交账号
 * @param csDto 创建社交账号DTO
 * @param session 事务会话
 * @returns 创建的社交账号
 */
    private async createSocial(csDto: CreateSocialDto, session?: ClientSession): Promise<XUser> {
        const { userId, provider, details } = csDto
        try {
            // 将DTO转换为Social文档格式
            const socialData: Social = {
                userId: userId,
                provider: provider,
                details: details
            }

            // 检查是否已存在相同社交媒体ID的账号
            // 这里使用了 'details.id' 索引
            const existingSocial = await this.socialModel.findOne({
                'details.id': details.id,
                provider: provider
            }, null, { session }).exec()

            if (existingSocial) {
                // 如果存在且未绑定，则更新绑定关系
                if (existingSocial.userId === null) {
                    const updatedSocial = await this.socialModel.findOneAndUpdate(
                        {
                            'details.id': details.id,
                            provider: provider,
                            userId: null
                        },
                        {
                            $set: {
                                userId: userId,
                                details: details
                            }
                        },
                        { new: true, session }
                    ).exec()

                    if (updatedSocial) {
                        return updatedSocial.toJSON().details
                    }
                }

                throw new BadRequestException(`Social account with ID ${details.id} already exists and is bound to another user`)
            }

            // 创建新的社交账号
            const createdSocialAccount = new this.socialModel(socialData)
            await createdSocialAccount.save({ session })

            return createdSocialAccount.toJSON().details

        } catch (error) {
            this.logger.error(`Failed to create social account: ${error.message}`, error.stack)
            throw error
        }
    }
}
