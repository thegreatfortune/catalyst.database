
import { PartialType } from '@nestjs/swagger'
import { SocialAccountTokenStateAddDto } from './add-social-account.dto'
import { IsDate, IsOptional, IsString } from 'class-validator'

export class UpdateSocialAccountTokenStateDto {
    @IsOptional()
    @IsString()
    accessToken?: string

    @IsOptional()
    @IsString()
    refreshToken?: string

    @IsOptional()
    @IsDate()
    tokenExpiry?: Date

    @IsOptional()
    @IsString()
    scope?: string
}