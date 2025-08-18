// src/database/dto/create-user.dto.ts
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UserWalletInfoDto {
  @IsString()
  @IsOptional()
  ens?: string;

  @IsString()
  @IsOptional()
  balance?: string;

  @IsOptional()
  tokenBalances?: {
    tokenAddress: string;
    symbol: string;
    balance: string;
    decimals: number;
  }[];
}

export class UserPreferencesDto {
  @IsOptional()
  notifications?: {
    push: boolean;
    contentMentions: boolean;
    newFollowers: boolean;
    contentInteractions: boolean;
  };

  @IsOptional()
  privacy?: {
    profileVisibility: string;
    showWalletActivity: boolean;
    allowDirectMessages: boolean;
  };

  @IsOptional()
  interface?: {
    theme: string;
    language: string;
    timezone: string;
  };

  @IsOptional()
  contentPreferences?: {
    topics: string[];
    blockedKeywords: string[];
  };
}

export class UserSocialAccountDto {
  @IsEnum(['twitter', 'instagram', 'rednote', 'facebook'])
  @IsNotEmpty()
  platform: 'twitter' | 'instagram' | 'rednote' | 'facebook';

  @IsString()
  @IsNotEmpty()
  accountId: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsOptional()
  displayName?: string;

  @IsString()
  @IsOptional()
  profileUrl?: string;

  @IsString()
  @IsOptional()
  accessToken?: string;

  @IsString()
  @IsOptional()
  refreshToken?: string;

  @IsOptional()
  tokenExpiry?: Date;

  @IsBoolean()
  @IsOptional()
  isConnected?: boolean = false;
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  walletAddress: string;

  @IsString()
  @IsOptional()
  chainType?: string = 'bnb';

  @IsString()
  @IsOptional()
  displayName?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @IsOptional()
  @ValidateNested()
  @Type(() => UserWalletInfoDto)
  walletInfo?: UserWalletInfoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UserPreferencesDto)
  preferences?: UserPreferencesDto;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UserSocialAccountDto)
  socialAccounts?: UserSocialAccountDto[];
}
