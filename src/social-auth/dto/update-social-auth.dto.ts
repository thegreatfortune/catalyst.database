import { Type } from "class-transformer"
import { SocialProvider } from "../../schemas/user.schema"
import { IsDate, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from "class-validator"

export class UpdateSocialAuthDto {
    @IsString()
    @IsMongoId()
    @IsNotEmpty()
    userId: string

    @IsEnum(SocialProvider)
    @IsNotEmpty()
    provider: SocialProvider

    @IsString()
    @IsOptional()
    accessToken?: string

    @IsString()
    @IsOptional()
    refreshToken?: string

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    tokenExpiry?: Date
}