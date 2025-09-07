import { Type } from "class-transformer"
import { IsBoolean, IsMongoId, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator"


export class AnonymousIdentityDto {

    @IsString()
    @IsNotEmpty()
    name: string

    @IsString()
    @IsNotEmpty()
    avatar: string

    @IsOptional()
    @ValidateNested()
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