import { Module } from '@nestjs/common'
import { SocialAuthController } from './social-auth.controller'
import { SocialAuthService } from './social-auth.service'

@Module({
  controllers: [SocialAuthController],
  providers: [SocialAuthService],
  exports: [SocialAuthService]
})
export class SocialAuthModule { }
