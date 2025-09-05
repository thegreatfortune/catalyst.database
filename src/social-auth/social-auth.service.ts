import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { ClientSession, Model, Types } from 'mongoose'
import { SocialAuth, XAuth } from '../schemas/social-auth.schema'
import { CreateSocialAuthDto, UpdateSocialAuthDto, GetSocialAuthDto, RemoveSocialAuthDto, UpdateLastUsedAtDto } from './dto/social-auth.dto'


@Injectable()
export class SocialAuthService {

    private readonly logger = new Logger(SocialAuthService.name);
    constructor(
        @InjectModel(SocialAuth.name) private socialAuthModel: Model<SocialAuth>
    ) { }

    async createSocialAuth(csaDto: CreateSocialAuthDto, session?: ClientSession): Promise<XAuth> {
        try {
            const createdSocialAuth = new this.socialAuthModel({
                ...csaDto,
                lastUsedAt: new Date()
            })
            await createdSocialAuth.save({ session })
            return createdSocialAuth.toJSON().details
        } catch (error) {
            this.logger.error(`Failed to create social auth for user ${csaDto.userId} and provider ${csaDto.provider}`, error)
            throw error
        }
    }

    async getSocialAuth(gsaDto: GetSocialAuthDto, session?: ClientSession): Promise<XAuth> {
        const { userId, provider } = gsaDto
        try {
            const socialAuth = await this.socialAuthModel.findOne(
                {
                    userId: new Types.ObjectId(userId),
                    provider
                },
                null,
                { session: session }
            ).exec()
            if (!socialAuth) {
                throw new NotFoundException(`No social auth found for user ${userId} and provider ${provider}`)
            }
            return socialAuth.toJSON().details
        } catch (error) {
            this.logger.error(`Failed to get social auth for user ${userId} and provider ${provider}`, error)
            throw error
        }
    }

    /**
     * 更新社交账号
     * @param usaDto 更新社交账号DTO，如不提供details，则视为更新lastUsedAt
     * @param session 
     * @returns 
     */
    async updateSocialAuth(usaDto: UpdateSocialAuthDto, session?: ClientSession): Promise<XAuth> {
        try {
            const { userId, provider, details } = usaDto
            // 如果没有要更新的字段，抛出错误
            if (details && Object.keys(details).length !== 4) {
                throw new BadRequestException('Update fields must be accessToken, refreshToken, tokenExpiry, scope')
            }

            const operation: Record<string, any> = {}
            if (details) {
                operation.details = details
            } else {
                operation.lastUsedAt = new Date()
            }

            const updatedSocialAuth = await this.socialAuthModel.findOneAndUpdate(
                {
                    userId: new Types.ObjectId(userId),
                    provider
                },
                {
                    $set: operation
                },
                { new: true, session, }
            ).exec()

            if (!updatedSocialAuth) {
                throw new NotFoundException(`No social auth found for user ${userId} and provider ${provider}`)
            }

            return updatedSocialAuth.toJSON().details
        } catch (error) {
            this.logger.error(`Failed to update social auth for user ${usaDto.userId} and provider ${usaDto.provider}`, error)
            throw error
        }
    }

    async removeSocialAuth(rsaDto: RemoveSocialAuthDto, session?: ClientSession): Promise<void> {
        try {
            const { userId, provider } = rsaDto
            const removedSocialAuth = await this.socialAuthModel.findOneAndDelete(
                {
                    userId: new Types.ObjectId(userId),
                    provider
                },
                { session }
            ).exec()
            if (!removedSocialAuth) {
                // 如果没有找到，说明社交账号已经解绑，继续流程
                this.logger.warn(`No social auth found for user ${userId} and provider ${provider}`)
            }
        } catch (error) {
            this.logger.error(`Failed to remove social auth for user ${rsaDto.userId} and provider ${rsaDto.provider}`, error)
            throw error
        }
    }
}
