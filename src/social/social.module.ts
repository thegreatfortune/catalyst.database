import { Module } from '@nestjs/common'
import { SocialController } from './social.controller'
import { SocialService } from './social.service'
import { MongooseModule } from '@nestjs/mongoose'
import { Social, SocialSchema } from '../schemas/social.schema'
import { User, UserSchema } from '../schemas/user.schema'
import { SocialAuthModule } from '../social-auth/social-auth.module'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Social.name, schema: SocialSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    SocialAuthModule
  ],
  controllers: [SocialController],
  providers: [SocialService],
  exports: [SocialService]
})
export class SocialModule { }
