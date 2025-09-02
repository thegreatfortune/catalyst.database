import { Module } from '@nestjs/common'
import { SocialAuthController } from './social-auth.controller'
import { SocialAuthService } from './social-auth.service'
import { MongooseModule } from '@nestjs/mongoose'
import { SocialAuth, SocialAuthSchema, XAuthSchema } from '../schemas/social-auth.schema'
import { SocialProvider } from '../schemas/user.schema'
import mongoose from 'mongoose'

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: SocialAuth.name,
        useFactory: () => {
          const schema = SocialAuthSchema

          // 为X平台注册discriminator，其他平台以此类推
          schema.discriminator(SocialProvider.X, new mongoose.Schema({
            details: {
              type: XAuthSchema,
              required: true
            }
          }))

          return schema
        }
      }
    ])
  ],
  controllers: [SocialAuthController],
  providers: [SocialAuthService],
  exports: [SocialAuthService]
})
export class SocialAuthModule { }
