import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator"

export enum PlatformType {
    Desktop = 'desktop',
    Mobile = 'mobile'
}

export class CreateRefreshTokenDto {
    @IsString()
    @IsNotEmpty()
    userId: string

    @IsString()
    @IsNotEmpty()
    token: string

    @IsEnum(PlatformType)
    @IsNotEmpty()
    platformType: PlatformType
}

export class FindRefreshTokenDto {
    @IsOptional()
    @IsString()
    token?: string

    @IsOptional()
    @IsString()
    userId?: string

    @IsEnum(PlatformType)
    @IsNotEmpty()
    platformType?: PlatformType
}

export class UpdateRefreshTokenDto {
    @IsString()
    @IsNotEmpty()
    oldToken: string

    @IsString()
    @IsNotEmpty()
    newToken: string
}

export class RemoveRefreshTokenDto {
    @IsString()
    @IsNotEmpty()
    userId: string

    @IsString()
    @IsNotEmpty()
    token: string
}