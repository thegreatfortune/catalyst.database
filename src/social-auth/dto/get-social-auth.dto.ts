import { SocialProvider } from "../../schemas/user.schema"
import { IsEnum, IsMongoId, IsNotEmpty, IsString } from "class-validator"

export class GetSocialAuthDto {
    @IsString()
    @IsMongoId()
    @IsNotEmpty()
    userId: string

    @IsEnum(SocialProvider)
    @IsNotEmpty()
    provider: SocialProvider
}