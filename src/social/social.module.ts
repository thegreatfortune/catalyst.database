import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { SocialController } from './social.controller'
import { SocialService } from './social.service'
import { Social, SocialSchema, XUserSchema } from '../schemas/social.schema'
import { SocialProvider, User, UserSchema } from '../schemas/user.schema'
import { SocialAuthModule } from '../social-auth/social-auth.module'
import mongoose from 'mongoose'

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Social.name,
        useFactory: () => {
          const schema = SocialSchema

          // 为X平台注册discriminator，其他平台以此类推
          schema.discriminator(SocialProvider.X, new mongoose.Schema({
            details: {
              type: XUserSchema,
              required: true
            }
          }))

          return schema
        }
      }
    ]),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema }
    ]),
    SocialAuthModule
  ],
  controllers: [SocialController],
  providers: [SocialService],
  exports: [SocialService],
})
export class SocialModule { }
