import { SocialProvider } from "src/schemas/user.schema"
import { IsEnum, IsNotEmpty, IsMongoId, IsString, IsNumber, Min } from "class-validator"
import { Type } from "class-transformer"

export class GetContributorDto {
    @IsMongoId()
    @IsNotEmpty()
    excludedUserId: string

    @IsEnum(SocialProvider)
    @IsNotEmpty()
    provider: SocialProvider

    @IsNumber()
    @IsNotEmpty()
    @Min(1)
    @Type(() => Number)
    count: number
}
