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
  tokenExpiry?: Date

  @IsOptional()
  @IsString()
  scope?: string
}

export class AddSocialAccountDto {
  @IsEnum(['twitter', 'instagram', 'rednote', 'facebook'])
  @IsNotEmpty()
  platform: 'twitter' | 'instagram' | 'rednote' | 'facebook'

  @ValidateNested()
  @Type(() => SocialAccountAddDto)
  socialAccountDto: SocialAccountAddDto

  @ValidateNested()
  @Type(() => SocialAccountTokenStateAddDto)
  socialAccountTokenStateDto: SocialAccountTokenStateAddDto
}
