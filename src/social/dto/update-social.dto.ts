import { Type } from "class-transformer"
import { IsEnum, IsNotEmpty } from "class-validator"
import { SocialProvider } from "../../schemas/user.schema"
import { XUser } from "src/schemas/social.schema"

export class UpdateXUserDetailsDto extends XUser {

}

export class UpdateSocialDto {

    @IsEnum(SocialProvider)
    @IsNotEmpty()
    provider: SocialProvider

    @Type(() => Object, {
        // 根据provider字段动态确定details的类型
        discriminator: {
            property: 'provider',
            subTypes: [
                { value: UpdateXUserDetailsDto, name: SocialProvider.X },
            ]
        }
    })
    details: UpdateXUserDetailsDto
}