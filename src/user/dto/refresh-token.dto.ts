import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator"
import { DeviceType } from "../../schemas/user.schema"


export class CreateRefreshTokenDto {
    @IsString()
    @IsNotEmpty()
    userId: string

    @IsString()
    @IsNotEmpty()
    token: string

    @IsEnum(DeviceType)
    @IsNotEmpty()
    deviceType: DeviceType
}

export class FindRefreshTokenDto {
    @IsNotEmpty()
    @IsString()
    token: string

    // @IsOptional()
    // @IsString()
    // userId: string

    @IsEnum(DeviceType)
    @IsNotEmpty()
    deviceType: DeviceType
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