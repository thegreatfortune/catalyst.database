import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { UserModule } from './user/user.module'
import { ContentModule } from './content/content.module'
import { MongooseModule } from '@nestjs/mongoose'
import { ConfigModule } from './config/config.module'
import { ConfigService } from './config/config.service'

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
    UserModule,
    ContentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
