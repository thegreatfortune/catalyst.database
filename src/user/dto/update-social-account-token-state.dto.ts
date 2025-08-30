
import { PartialType } from '@nestjs/swagger'
import { SocialAccountTokenStateAddDto } from './add-social-account.dto'
import { IsDate, IsOptional, IsString } from 'class-validator'
import { Type } from 'class-transformer'

export class UpdateSocialAccountTokenStateDto {
    @IsOptional()
    @IsString()
    accessToken?: string

    @IsOptional()
    @IsString()
    refreshToken?: string

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    tokenExpiry?: Date

    @IsOptional()
    @IsString()
    scope?: string
}