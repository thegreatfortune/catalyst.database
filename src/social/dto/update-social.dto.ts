import { Type } from "class-transformer"
import { IsBoolean, IsDate, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from "class-validator"
import { SocialProvider } from "../../schemas/user.schema"
import { XPublicMetrics, XUser, XVerifiedType } from "src/schemas/social.schema"
import { OmitType, PartialType } from "@nestjs/swagger"

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