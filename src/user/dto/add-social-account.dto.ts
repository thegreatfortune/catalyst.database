import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'
import { SocialProvider } from '../../schemas/user.schema'

export class MetricsAddDto {
  @IsNumber()
  @IsNotEmpty()
  followers: number

  @IsNumber()
  @IsNotEmpty()
  following: number

  @IsNumber()
  @IsNotEmpty()
  totalPosts: number
}

export class SocialAccountAddDto {
  @IsNotEmpty()
  @IsString()
  accountId: string

  @IsNotEmpty()
  @IsString()
  username: string

  @IsOptional()
  @IsString()
  displayName?: string

  @IsString()
  @IsOptional()
  profileUrl?: string

  @ValidateNested()
  @Type(() => MetricsAddDto)
  metrics: MetricsAddDto

  @IsNotEmpty()
  @IsDate()
  lastSyncedAt: Date

  @IsNotEmpty()
  @IsBoolean()
  isConnected: boolean = true;
}


export class SocialAccountTokenStateAddDto {
  @IsOptional()
  @IsString()
  accessToken?: string

  @IsOptional()
  @IsString()
  refreshToken?: string

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  tokenExpiry?: Date

  @IsOptional()
  @IsString()
  scope?: string
}

export class AddSocialAccountDto {
  @IsEnum(SocialProvider)
  @IsNotEmpty()
  provider: SocialProvider

  @ValidateNested()
  @Type(() => SocialAccountAddDto)
  socialAccountAddDto: SocialAccountAddDto

  @ValidateNested()
  @Type(() => SocialAccountTokenStateAddDto)
  socialAccountTokenStateAddDto: SocialAccountTokenStateAddDto
}
