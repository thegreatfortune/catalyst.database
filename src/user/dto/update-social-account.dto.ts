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
import { SocialProvider } from '../../schemas/user.schema'

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
  @IsEnum(SocialProvider)
  @IsNotEmpty()
  provider: SocialProvider;

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
