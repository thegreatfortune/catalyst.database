import { Module } from '@nestjs/common'
import { SocialController } from './social.controller'
import { SocialService } from './social.service'
import { SocialAuthModule } from '../social-auth/social-auth.module'
import { CreditModule } from '../credit/credit.module'

@Module({
  imports: [SocialAuthModule, CreditModule],
  controllers: [SocialController],
  providers: [SocialService],
  exports: [SocialService],
})
export class SocialModule { }
