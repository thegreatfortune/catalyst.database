import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { ClientSession, Model } from 'mongoose'
import { SocialAuth } from '../schemas/social-auth.schema'
import { SocialProvider } from '../schemas/user.schema'
import { CreateSocialAuthDto } from './dto/create-social-auth.dto'
import { UpdateSocialAuthDto } from './dto/update-social-auth.dto'
import { GetSocialAuthDto } from './dto/get-social-auth.dto'

@Injectable()
export class SocialAuthService {

    private readonly logger = new Logger(SocialAuthService.name);
    constructor(
        @InjectModel(SocialAuth.name) private socialAuthModel: Model<SocialAuth>
    ) { }

    async getSocialAuth(gsaDto: GetSocialAuthDto, session?: ClientSession): Promise<SocialAuth> {
        const { userId, provider } = gsaDto
        try {
            const socialAuth = await this.socialAuthModel.findOne(
                { userId, provider }, { session }).exec()
            if (!socialAuth) {
                throw new NotFoundException(`No social auth found for user ${userId} and provider ${provider}`)
            }
            return socialAuth.toJSON()
        } catch (error) {
            this.logger.error(`Failed to get social auth for user ${userId} and provider ${provider}`, error)
            throw error
        }
    }

    async createSocialAuth(csaDto: CreateSocialAuthDto, session?: ClientSession): Promise<SocialAuth> {
        try {
            const createdSocialAuth = new this.socialAuthModel(csaDto)
            await createdSocialAuth.save({ session })
            return createdSocialAuth.toJSON()
        } catch (error) {
            this.logger.error(`Failed to create social auth for user ${csaDto.userId} and provider ${csaDto.provider}`, error)
            throw error
        }
    }

    async updateSocialAuth(usaDto: UpdateSocialAuthDto, session?: ClientSession): Promise<SocialAuth> {
        try {
            const { userId, provider, ...updateData } = usaDto
            const updatedSocialAuth = await this.socialAuthModel.findOneAndUpdate(
                {
                    userId,
                    provider
                },
                { ...updateData },
                { new: true, session }
            ).exec()
            if (!updatedSocialAuth) {
                throw new NotFoundException(`No social auth found for user ${userId} and provider ${provider}`)
            }
            return updatedSocialAuth.toJSON()
        } catch (error) {
            this.logger.error(`Failed to update social auth for user ${usaDto.userId} and provider ${usaDto.provider}`, error)
            throw error
        }
    }
}
