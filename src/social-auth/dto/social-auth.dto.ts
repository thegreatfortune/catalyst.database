import { Type } from "class-transformer"
import { SocialProvider } from "../../schemas/user.schema"
import { IsDate, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator"
import { XAuth } from "../../schemas/social-auth.schema"
import { GetSocialDto } from "../../social/dto/get-social.dto"


export class XAuthDto implements XAuth {
    @IsString()
    @IsNotEmpty()
    accessToken: string

    @IsString()
    @IsNotEmpty()
    refreshToken: string

    @IsDate()
    @IsNotEmpty()
    @Type(() => Date)
    tokenExpiry: Date

    @IsString()
    @IsNotEmpty()
    scope: string
}

export class CreateSocialAuthDto {
    @IsNotEmpty()
    @IsMongoId()
    userId: string

    @IsNotEmpty()
    @IsEnum(SocialProvider)
    provider: SocialProvider

    @IsNotEmpty()
    @ValidateNested()
    @Type((options) => {
        // 手动根据顶级 provider 选择类型
        const provider = options?.object?.provider
        if (provider === SocialProvider.X) return XAuthDto
        return Object
    })
    details: XAuthDto
}

export class GetSocialAuthDto extends GetSocialDto {
}

export class UpdateSocialAuthDto extends GetSocialDto {
    @IsOptional()
    @ValidateNested()
    @Type((options) => {
        // 手动根据顶级 provider 选择类型
        const provider = options?.object?.provider
        if (provider === SocialProvider.X) return XAuthDto
        return Object
    })
    details?: XAuthDto
}

export class RemoveSocialAuthDto extends GetSocialDto {
}

export class UpdateLastUsedAtDto extends GetSocialDto {

}