import { Type } from "class-transformer"
import { ArrayMaxSize, IsBoolean, IsMongoId, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator"


export class AnonymousIdentityDto {
    @IsMongoId()
    @IsNotEmpty()
    id: string

    @IsString()
    @IsOptional()
    name?: string

    @IsOptional()
    @ArrayMaxSize(5, { message: '性格标签最多只能有5个' })
    @IsString({ each: true, message: '性格标签必须是字符串' })
    preferences?: string[]

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    isDeleted?: boolean
}

export class UpdateAnonymousIdentityDto {

    @IsMongoId()
    @IsNotEmpty()
    userId: string

    @IsNotEmpty()
    @ValidateNested()
    @Type(() => AnonymousIdentityDto)
    anonymousIdentities: Array<AnonymousIdentityDto>
}