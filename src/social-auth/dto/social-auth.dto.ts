import { Type } from "class-transformer"
import { SocialProvider } from "../../schemas/user.schema"
import { IsEnum, IsMongoId, IsNotEmpty, IsString, ValidateNested } from "class-validator"
import { XAuth } from "../../schemas/social-auth.schema"
import { GetSocialDto } from "../../social/dto/get-social.dto"


export class CreateXAuthDetailsDto extends XAuth {
}

export class CreateSocialAuthDto {
    @IsString()
    @IsMongoId()
    @IsNotEmpty()
    userId: string

    @IsEnum(SocialProvider)
    @IsNotEmpty()
    provider: SocialProvider


    @Type(() => Object, {
        // 根据provider字段动态确定details的类型
        discriminator: {
            property: 'provider',
            subTypes: [
                { value: CreateXAuthDetailsDto, name: SocialProvider.X },
            ]
        }
    })
    details: CreateXAuthDetailsDto
}

export class GetSocialAuthDto extends GetSocialDto {
}

export class UpdateSocialAuthDto extends CreateSocialAuthDto {
}

export class RemoveSocialAuthDto extends GetSocialDto {
}