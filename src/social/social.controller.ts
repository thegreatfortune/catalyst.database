import { BadRequestException, Body, Controller, Delete, Get, InternalServerErrorException, NotFoundException, Patch, Post, Query } from '@nestjs/common'
import { SocialService } from './social.service'
import { BindSocialAccountDto } from './dto/bind-social-account.dto'
import { GetSocialDto } from './dto/get-social.dto'
import { XUser } from '../schemas/social.schema'
import { RemoveSocialDto } from './dto/remove-social.dto'
import { UpdateSocialDto } from './dto/update-social.dto'

@Controller('user/social')
export class SocialController {
    constructor(private readonly socialService: SocialService) { }

    /**
     * 绑定社交账号
     * @param bindSocialDto 绑定社交账号DTO
     * @returns 
     */
    @Post()
    async bindSocial(
        @Body() bsDto: BindSocialAccountDto,
    ) {
        const csDto = bsDto.csDto
        const csaDto = bsDto.csaDto

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
     * 解绑社交账号
     * @param rsDto 解绑社交账号DTO
     * @returns 
     */
    @Delete()
    async unbindSocial(
        @Body() rsDto: RemoveSocialDto,
    ) {
        try {
            return this.socialService.unbindSocial(rsDto)
        } catch (error) {
            if (
                error instanceof NotFoundException ||
                error instanceof BadRequestException
            ) {
                throw error
            }
            throw new InternalServerErrorException('解绑社交账号失败')
        }
    }

    /**
     * 更新社交账号
     * @param usDto 更新社交账号DTO
     * @returns 
     */
    @Patch()
    async updateSocial(
        @Body() usDto: UpdateSocialDto,
    ) {
        try {
            return this.socialService.updateSocial(usDto)
        } catch (error) {
            if (
                error instanceof NotFoundException ||
                error instanceof BadRequestException
            ) {
                throw error
            }
            throw new InternalServerErrorException('更新社交账号失败')
        }
    }

    /**
     * 获取社交账号
     * @param gsDto 获取社交账号DTO
     * @returns 
     */
    @Get()
    async getSocial(
        @Query() gsDto: GetSocialDto,
    ): Promise<XUser> {
        try {
            return await this.socialService.getSocial(gsDto)
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
