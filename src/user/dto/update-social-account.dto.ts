import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  SocialAccountAddDto,
  SocialAccountTokenStateAddDto,
} from './add-social-account.dto';
import { PartialType } from '@nestjs/swagger';

export class SocialAccountUpdateDto extends PartialType(SocialAccountAddDto) {}

export class SocialAccountTokenStateUpdateDto extends PartialType(
  SocialAccountTokenStateAddDto,
) {}

export class SocialAccountMiningStateUpdateDto {
  @IsNumber()
  @IsNotEmpty()
  points: number;

  @IsNumber()
  @IsNotEmpty()
  count: number;
}

export class UpdateSocialAccountDto {
  @IsEnum(['twitter', 'instagram', 'rednote', 'facebook'])
  @IsNotEmpty()
  platform: 'twitter' | 'instagram' | 'rednote' | 'facebook';

  @IsOptional()
  @ValidateNested()
  @Type(() => SocialAccountUpdateDto)
  socialAccount?: SocialAccountUpdateDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SocialAccountMiningStateUpdateDto)
  socialAccountMiningState?: SocialAccountMiningStateUpdateDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SocialAccountTokenStateUpdateDto)
  socialAccountTokenState?: SocialAccountTokenStateUpdateDto;
}
