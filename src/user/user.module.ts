import { Module } from '@nestjs/common'
import { UserService } from './user.service'
import { UserController } from './user.controller'
import { RefreshTokenService } from './refresh-token.service'
import { CreditModule } from 'src/credit/credit.module'
import { SocialModule } from 'src/social/social.module'

@Module({
  imports: [CreditModule, SocialModule],
  controllers: [UserController],
  providers: [UserService, RefreshTokenService],
  exports: [UserService],
})
export class UserModule { }
