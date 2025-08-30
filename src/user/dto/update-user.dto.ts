import { Type } from "class-transformer"
import { IsBoolean, IsDate, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator"
import { DefaultCurrency, Language, Preferences, Theme, Timezone } from "../../schemas/user.schema"



export class UpdateUIDto {
    @IsOptional()
    @IsEnum(Language)
    language?: Language

    @IsOptional()
    @IsEnum(Theme)
    theme?: Theme

    @IsOptional()
    @IsEnum(DefaultCurrency)
    defaultCurrency?: DefaultCurrency

    @IsOptional()
    @IsEnum(Timezone)
    timezone?: Timezone
}

export class UpdateAiDto {
    @IsOptional()
    @IsBoolean()
    enabled?: boolean
}
export class UpdatePreferencesDto {
    @IsOptional()
    @ValidateNested()
    @Type(() => UpdateUIDto)
    ui?: UpdateUIDto

    @IsOptional()
    @ValidateNested()
    @Type(() => UpdateAiDto)
    ai?: UpdateAiDto
}

export class AnonymousIdentityDto {
    @IsUUID()
    @IsOptional()
    id?: string

    @IsString()
    @IsOptional()
    name?: string

    @IsString()
    @IsOptional()
    avatar?: string

    @IsOptional()
    @ValidateNested()
    @Type(() => Array<string>)
    preferences?: string[]

    @IsOptional()
    @IsBoolean()
    isActive?: boolean

    @IsOptional()
    @IsBoolean()
    isDeleted?: boolean
}

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    name?: string

    @IsString()
    @IsOptional()
    email?: string

    @IsString()
    @IsOptional()
    bio?: string

    @IsOptional()
    @ValidateNested()
    @Type(() => UpdatePreferencesDto)
    preferences?: UpdatePreferencesDto

    @IsOptional()
    @ValidateNested()
    @Type(() => Array<AnonymousIdentityDto>)
    anonymousIdentities?: Array<AnonymousIdentityDto>
}