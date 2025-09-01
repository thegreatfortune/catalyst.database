import { Type } from 'class-transformer'
import { ValidateNested } from 'class-validator'
import { CreateSocialDto } from '../../social/dto/create-social.dto'
import { CreateSocialAuthDto } from '../../social-auth/dto/create-social-auth.dto'

export class BindSocialAccountDto {
  @ValidateNested()
  @Type(() => CreateSocialDto)
  csDto: CreateSocialDto

  @ValidateNested()
  @Type(() => CreateSocialAuthDto)
  csaDto: CreateSocialAuthDto
}