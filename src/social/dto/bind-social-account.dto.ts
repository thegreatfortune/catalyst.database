import { Type } from 'class-transformer'
import { IsNotEmpty, ValidateNested } from 'class-validator'
import { CreateSocialDto } from '../../social/dto/create-social.dto'
import { CreateSocialAuthDto } from '../../social-auth/dto/social-auth.dto'

export class BindSocialAccountDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateSocialDto)
  csDto: CreateSocialDto

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateSocialAuthDto)
  csaDto: CreateSocialAuthDto
}