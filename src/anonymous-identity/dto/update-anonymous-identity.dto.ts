import { Type } from "class-transformer"
import { IsBoolean, IsMongoId, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator"


export class AnonymousIdentityDto {
    @IsMongoId()
    @IsNotEmpty()
    id: string

    @IsString()
    @IsOptional()
    name?: string

    @IsString()
    @IsOptional()
    avatar?: string

    @IsOptional()
    @ValidateNested()
    preferences?: string[]

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    isActive?: boolean

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