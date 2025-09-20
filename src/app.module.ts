import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { UserModule } from './user/user.module'
import { ContentModule } from './content/content.module'
import { MongooseModule } from '@nestjs/mongoose'
import { ConfigModule } from './config/config.module'
import { ConfigService } from './config/config.service'
import { LogModule } from './log/log.module'
import { CreditModule } from './credit/credit.module'
import { SocialAuthModule } from './social-auth/social-auth.module'
import { SocialModule } from './social/social.module'
import { DatabaseModule } from './database/database.module'
import { AnonymousIdentityModule } from './anonymous-identity/anonymous-identity.module'
import { RedisModule } from './redis/redis.module'
import { FundsModule } from './funds/funds.module'

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
    CreditModule,
    FundsModule,
    AnonymousIdentityModule,
    UserModule,
    ContentModule,
    LogModule,
    RedisModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [DatabaseModule],
})
export class AppModule { }
