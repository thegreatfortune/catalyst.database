import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common'
import { BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common'
import { GetSocialAuthDto, UpdateSocialAuthDto } from './dto/social-auth.dto'
import { SocialAuthService } from './social-auth.service'
import { SocialAuth } from '../schemas/social-auth.schema'


@Controller('user/social-auth')
export class SocialAuthController {
    constructor(
        private readonly socialAuthService: SocialAuthService,
    ) { }

    @Get()
    async getSocialAuth(
        @Query() gsaDto: GetSocialAuthDto,
    ): Promise<SocialAuth> {
        const { userId, provider } = gsaDto
        try {
            return await this.socialAuthService.getSocialAuth(gsaDto)
        } catch (error) {
            if (
                error instanceof NotFoundException ||
                error instanceof BadRequestException
            ) {
                throw error
            }
            throw new InternalServerErrorException(
                `Failed to get social auth for user ${userId} and provider ${provider}`,
            )
        }
    }

    @Patch()
    async updateSocialAuth(@Body() usaDto: UpdateSocialAuthDto): Promise<SocialAuth> {
        try {
            return this.socialAuthService.updateSocialAuth(usaDto)
        } catch (error) {
            if (
                error instanceof NotFoundException ||
                error instanceof BadRequestException
            ) {
                throw error
            }
            throw new InternalServerErrorException(
                `Failed to update social auth for user ${usaDto.userId} and provider ${usaDto.provider}`
            )
        }
    }
}
