import { BadRequestException, Body, Controller, Get, InternalServerErrorException, NotFoundException, Post, Query } from '@nestjs/common'
import { SocialService } from './social.service'
import { CreateSocialDto } from './dto/create-social.dto'
import { BindSocialAccountDto } from './dto/bind-social-account.dto'
import { GetSocialDto } from './dto/get-social.dto'
import { Social } from '../schemas/social.schema'

@Controller('user/social')
export class SocialController {
    constructor(private readonly socialService: SocialService) { }

    /**
     * 绑定社交账号
     * @param bindSocialAccountDto 绑定社交账号DTO
     * @returns 
     */
    @Post()
    async bindSocialAccount(
        @Body() bindSocialAccountDto: BindSocialAccountDto,
    ) {
        const csDto = bindSocialAccountDto.csDto
        const csaDto = bindSocialAccountDto.csaDto

        if (csDto.userId !== csaDto.userId
            || csDto.provider !== csaDto.provider
        ) {
            throw new BadRequestException(`No matching user ID and provider`)
        }

        try {
            return this.socialService.bindSocialAccount(csDto, csaDto)
        } catch (error) {
            if (
                error instanceof NotFoundException ||
                error instanceof BadRequestException
            ) {
                throw error
            }
            throw new InternalServerErrorException('添加社交账号失败')
        }
    }

    /**
     * 获取社交账号
     * @param gsDto 获取社交账号DTO
     * @returns 
     */
    @Get()
    async getSocialAccount(
        @Query() gsDto: GetSocialDto,
    ): Promise<Social> {
        try {
            return await this.socialService.getSocialAccount(gsDto)
        } catch (error) {
            if (
                error instanceof NotFoundException ||
                error instanceof BadRequestException
            ) {
                throw error
            }
            throw new InternalServerErrorException(
                `Failed to get social account for user ${gsDto.userId} and provider ${gsDto.provider}`,
            )
        }
    }

}
