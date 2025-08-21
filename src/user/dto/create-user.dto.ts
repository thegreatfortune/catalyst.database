// src/database/dto/create-user.dto.ts
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
import { Type } from 'class-transformer'
import { PlatformType } from './refresh-token.dto'

export class WalletInfoDto {
  @IsString()
  @IsOptional()
  ens?: string

  @IsString()
  @IsOptional()
  balance?: string

  @IsOptional()
  tokenBalances?: {
    tokenAddress: string
    symbol: string
    balance: string
    decimals: number
  }[]
}

export class PreferencesDto {
  @IsOptional()
  notifications?: {
    push: boolean
    contentMentions: boolean
    newFollowers: boolean
    contentInteractions: boolean
  }

  @IsOptional()
  privacy?: {
    profileVisibility: string
    showWalletActivity: boolean
    allowDirectMessages: boolean
  }

  @IsOptional()
  interface?: {
    theme: string
    language: string
    timezone: string
  }

  @IsOptional()
  contentPreferences?: {
    topics: string[]
    blockedKeywords: string[]
  }
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  walletAddress: string

  @IsString()
  @IsNotEmpty()
  chainType: string = 'bnb';

  @IsDate()
  @IsNotEmpty()
  lastSignedAt: Date

  @IsString()
  @IsOptional()
  avatar?: string

  @IsString()
  @IsOptional()
  bio?: string

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @IsOptional()
  @ValidateNested()
  @Type(() => WalletInfoDto)
  walletInfo?: WalletInfoDto

  @IsOptional()
  @ValidateNested()
  @Type(() => PreferencesDto)
  preferences?: PreferencesDto
}
