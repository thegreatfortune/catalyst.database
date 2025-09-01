import { Module } from '@nestjs/common'
import { SocialAuthController } from './social-auth.controller'
import { SocialAuthService } from './social-auth.service'
import { MongooseModule } from '@nestjs/mongoose'
import { SocialAuth, SocialAuthSchema } from '../schemas/social-auth.schema'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SocialAuth.name, schema: SocialAuthSchema }])
  ],
  controllers: [SocialAuthController],
  providers: [SocialAuthService],
  exports: [SocialAuthService]
})
export class SocialAuthModule { }
