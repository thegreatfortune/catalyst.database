import { SocialProvider } from "src/schemas/user.schema"
import { IsEnum, IsNotEmpty, IsMongoId, IsString } from "class-validator"

export class RandomUserDto {
    @IsString()
    @IsMongoId()
    @IsNotEmpty()
    excludedUserId: string

    @IsEnum(SocialProvider)
    @IsNotEmpty()
    provider: SocialProvider
}
