import { Module } from '@nestjs/common'
import { SocialController } from './social.controller'
import { SocialService } from './social.service'
import { SocialAuthModule } from '../social-auth/social-auth.module'

@Module({
  imports: [SocialAuthModule],
  controllers: [SocialController],
  providers: [SocialService],
  exports: [SocialService],
})
export class SocialModule { }
