import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectConnection, InjectModel } from '@nestjs/mongoose'
import { ClientSession, Connection, Model } from 'mongoose'
import { Social, SocialDocument } from '../schemas/social.schema'
import { Logger } from '@nestjs/common'
import { CreateSocialDto } from './dto/create-social.dto'
import { GetSocialDto } from './dto/get-social.dto'
import { UpdateSocialDto } from './dto/update-social.dto'
import { CreateSocialAuthDto } from '../social-auth/dto/create-social-auth.dto'
import { User, UserDocument } from '../schemas/user.schema'
import { SocialAuthService } from '../social-auth/social-auth.service'

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
     * 绑定社交账号
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
                this.getSocialAccount({ userId, provider }, session),
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
                this.createSocialAccount(csDto, session),
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
     * 获取社交账号
     * @param gsDto 获取社交账号DTO
     * @param session 事务会话
     * @returns 社交账号
     */
    async getSocialAccount(gsDto: GetSocialDto, session?: ClientSession): Promise<Social> {
        const { userId, provider } = gsDto
        try {
            const socialAccount = await this.socialModel.findOne(
                { userId, provider },
                null,
                { session }
            ).exec()
            if (!socialAccount) {
                throw new NotFoundException(`No social account found for user ${userId} and provider ${provider}`)
            }
            return socialAccount.toJSON()
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
    async createSocialAccount(csDto: CreateSocialDto, session?: ClientSession): Promise<Social> {
        try {
            const createdSocialAccount = new this.socialModel(csDto)
            await createdSocialAccount.save({ session })
            return createdSocialAccount.toJSON()
        } catch (error) {
            this.logger.error(`Failed to create social account for user ${csDto.userId} and provider ${csDto.provider}`, error)
            throw error
        }
    }

    /**
     * 更新社交账号
     * @param usDto 更新社交账号DTO
     * @param session 事务会话
     * @returns 更新后的社交账号
     */
    async updateSocialAccount(usDto: UpdateSocialDto, session?: ClientSession): Promise<Social> {
        const { userId, provider, ...updateData } = usDto
        try {
            const updatedSocialAccount = await this.socialModel.findOneAndUpdate(
                { userId, provider },
                { ...updateData },
                { new: true, session }).exec()
            if (!updatedSocialAccount) {
                throw new NotFoundException(`No social account found for user ${userId} and provider ${provider}`)
            }
            return updatedSocialAccount.toJSON()
        } catch (error) {
            this.logger.error(`Failed to update social account for user ${userId} and provider ${provider}`, error)
            throw error
        }
    }
}
