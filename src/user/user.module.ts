import { Module } from '@nestjs/common'
import { UserService } from './user.service'
import { UserController } from './user.controller'
import { RefreshTokenService } from './refresh-token.service'
import { CreditModule } from '../credit/credit.module'
import { SocialModule } from '../social/social.module'
import { FundsModule } from '../funds/funds.module'

@Module({
  imports: [FundsModule, CreditModule, SocialModule],
  controllers: [UserController],
  providers: [UserService, RefreshTokenService],
  exports: [UserService],
})
export class UserModule { }
