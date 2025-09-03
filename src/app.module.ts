import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { UserModule } from './user/user.module'
import { ContentModule } from './content/content.module'
import { MongooseModule } from '@nestjs/mongoose'
import { ConfigModule } from './config/config.module'
import { ConfigService } from './config/config.service'
import { LogModule } from './log/log.module'
import { PointModule } from './point/point.module'
import { SocialAuthModule } from './social-auth/social-auth.module'
import { SocialModule } from './social/social.module'
import { SocialAuth, SocialAuthSchema, XAuthSchema } from './schemas/social-auth.schema'
import { SocialProvider, User, UserSchema } from './schemas/user.schema'
import mongoose from 'mongoose'
import { Point, PointSchema, PointTransaction, PointTransactionSchema } from './schemas/point.schema'
import { Social, SocialSchema, XUserSchema } from './schemas/social.schema'
import { Content, ContentSchema } from './schemas/content.schema'
import { DatabaseModule } from './database/database.module'

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.mongodbConnectionString,
      }),
    }),
    DatabaseModule,
    SocialModule,
    SocialAuthModule,
    PointModule,
    UserModule,
    ContentModule,
    LogModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [DatabaseModule],
})
export class AppModule { }
