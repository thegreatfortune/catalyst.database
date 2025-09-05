import { IsEnum, IsMongoId, IsNotEmpty, IsString } from "class-validator"
import { SocialProvider } from "../../schemas/user.schema"

export class GetSocialDto {
    @IsMongoId()
    @IsNotEmpty()
    userId: string

    @IsEnum(SocialProvider)
    @IsNotEmpty()
    provider: SocialProvider
}
