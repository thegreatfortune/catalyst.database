import { Type } from "class-transformer"
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator"
import { DefaultCurrency, Language, Theme, Timezone } from "../../schemas/user.schema"



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
    @Type(() => Boolean)
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
}