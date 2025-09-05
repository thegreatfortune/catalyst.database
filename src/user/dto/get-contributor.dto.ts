import { SocialProvider } from "src/schemas/user.schema"
import { IsEnum, IsNotEmpty, IsMongoId, IsString, IsNumber } from "class-validator"

export class GetContributorDto {
    @IsString()
    @IsMongoId()
    @IsNotEmpty()
    excludedUserId: string

    @IsEnum(SocialProvider)
    @IsNotEmpty()
    provider: SocialProvider

    @IsNumber()
    @IsNotEmpty()
    count: number
}
