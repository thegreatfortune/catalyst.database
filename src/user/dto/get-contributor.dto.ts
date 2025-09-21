import { SocialProvider } from "src/schemas/user.schema"
import { IsEnum, IsNotEmpty, IsMongoId, IsString, IsNumber, Min, IsArray, IsOptional } from "class-validator"
import { Type, Transform } from "class-transformer"

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

    @IsArray()
    @IsMongoId({ each: true })
    @IsOptional()
    @Transform(({ value }) => {
        if (typeof value === 'string' && value) {
            return value.split(',')
        }
        return []
    })
    toExcludedContributorIds?: string[]
}
