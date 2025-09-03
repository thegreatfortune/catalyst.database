import { Type } from "class-transformer"
import { IsEnum, IsMongoId, IsNotEmpty, IsString } from "class-validator"
import { SocialProvider } from "../../schemas/user.schema"
import { XUser } from "src/schemas/social.schema"


export class CreateSocialDto {

    @IsNotEmpty()
    @IsString()
    @IsMongoId()
    userId: string

    @IsEnum(SocialProvider)
    @IsNotEmpty()
    provider: SocialProvider

    @Type(() => Object, {
        // 根据provider字段动态确定details的类型
        discriminator: {
            property: 'provider',
            subTypes: [
                { value: XUser, name: SocialProvider.X },
            ]
        }
    })
    details: XUser
}