import { Type } from "class-transformer"
import { SocialProvider } from "../../schemas/user.schema"
import { IsDate, IsEnum, IsMongoId, IsNotEmpty, IsString, ValidateNested } from "class-validator"
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
    @IsString()
    @IsMongoId()
    @IsNotEmpty()
    userId: string

    @IsEnum(SocialProvider)
    @IsNotEmpty()
    provider: SocialProvider

    @ValidateNested()
    @Type(() => Object, {
        // 根据provider字段动态确定details的类型
        discriminator: {
            property: 'provider',
            subTypes: [
                { value: XAuthDto, name: SocialProvider.X },
            ]
        }
    })
    details: XAuthDto
}

export class GetSocialAuthDto extends GetSocialDto {
}

export class UpdateSocialAuthDto extends CreateSocialAuthDto {
}

export class RemoveSocialAuthDto extends GetSocialDto {
}