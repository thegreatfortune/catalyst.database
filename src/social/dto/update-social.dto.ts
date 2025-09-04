import { Type } from "class-transformer"
import { IsEnum, IsNotEmpty, ValidateNested } from "class-validator"
import { SocialProvider } from "../../schemas/user.schema"
import { XUserDto } from "./create-social.dto"

export class UpdateSocialDto {
    @IsNotEmpty()
    @IsEnum(SocialProvider)
    provider: SocialProvider

    @IsNotEmpty()
    @ValidateNested()
    @Type((options) => {
        // 手动根据顶级 provider 选择类型
        const provider = options?.object?.provider
        if (provider === SocialProvider.X) return XUserDto
        return Object
    })
    socialUsers: XUserDto[]
}