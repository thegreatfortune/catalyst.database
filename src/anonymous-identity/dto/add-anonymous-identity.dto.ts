import { Type } from "class-transformer"
import { ArrayMaxSize, IsBoolean, IsMongoId, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator"


export class AnonymousIdentityDto {

    @IsString()
    @IsNotEmpty()
    name: string

    @IsString()
    @IsNotEmpty()
    avatar: string

    @IsOptional()
    @ArrayMaxSize(5, { message: '性格标签最多只能有5个' })
    @IsString({ each: true, message: '性格标签必须是字符串' })
    preferences?: string[]
}

export class AddAnonymousIdentityDto {

    @IsMongoId()
    @IsNotEmpty()
    userId: string

    @IsNotEmpty()
    @ValidateNested()
    @Type(() => AnonymousIdentityDto)
    anonymousIdentity: AnonymousIdentityDto
}

