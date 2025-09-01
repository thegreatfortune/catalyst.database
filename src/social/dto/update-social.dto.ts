import { Type } from "class-transformer"
import { IsBoolean, IsDate, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator"
import { SocialProvider } from "../../schemas/user.schema"

export class MetricsDto {
    @IsNumber()
    @IsNotEmpty()
    @Type(() => Number)
    followers: number

    @IsNumber()
    @IsNotEmpty()
    @Type(() => Number)
    following: number

    @IsNumber()
    @IsNotEmpty()
    @Type(() => Number)
    totalPosts: number
}

export class UpdateSocialDto {
    @IsNotEmpty()
    @IsString()
    @IsMongoId()
    userId: string

    @IsEnum(SocialProvider)
    @IsNotEmpty()
    provider: SocialProvider

    @IsNotEmpty()
    @IsString()
    username?: string

    @IsOptional()
    @IsString()
    displayName?: string

    @IsString()
    @IsOptional()
    profileUrl?: string

    @ValidateNested()
    @Type(() => MetricsDto)
    metrics?: MetricsDto
}