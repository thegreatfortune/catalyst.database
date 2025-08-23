import { Type } from "class-transformer"
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator"
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

export class UpdateAnonymousDto {
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

    @IsOptional()
    @ValidateNested()
    @Type(() => UpdateAnonymousDto)
    anonymous?: UpdateAnonymousDto
}

export class AnonymousIdentityDto {
    @IsString()
    @IsNotEmpty()
    id: string

    @IsString()
    @IsNotEmpty()
    name: string

    @IsString()
    @IsNotEmpty()
    avatar: string

    @IsOptional()
    @ValidateNested()
    @Type(() => Array<string>)
    preferences?: string[]
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
    @Type(() => Preferences)
    preferences?: UpdatePreferencesDto

    @IsOptional()
    @ValidateNested()
    @Type(() => Array<AnonymousIdentityDto>)
    anonymousIdentities?: Array<AnonymousIdentityDto>
}