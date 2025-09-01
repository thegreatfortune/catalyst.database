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
    SocialModule,
    SocialAuthModule,
    PointModule,
    UserModule,
    ContentModule,
    LogModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
