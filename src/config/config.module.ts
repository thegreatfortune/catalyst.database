import { Module } from '@nestjs/common'
import { ConfigModule as NestConfigModule } from '@nestjs/config'
import * as Joi from 'joi'
import { ConfigService } from './config.service'

@Module({
    imports: [
        NestConfigModule.forRoot({
            isGlobal: true,
            envFilePath: `.env${process.env.NODE_ENV ? '.' + process.env.NODE_ENV : ''}`,
            validationSchema: Joi.object({
                PORT: Joi.number().default(3001),
                NODE_ENV: Joi.string()
                    .valid('development', 'production', 'test')
                    .default('development'),

                // MongoDB配置
                MONGODB_URI: Joi.string().required(),
                MONGODB_USER: Joi.string(),
                MONGODB_PASSWORD: Joi.string(),
                MONGODB_APPNAME: Joi.string(),

                // Redis配置
                UPSTASH_REDIS_REST_URL: Joi.string().required(),
                UPSTASH_REDIS_REST_TOKEN: Joi.string().required(),

                // 安全配置
                CORS_ORIGINS: Joi.string().default('http://localhost:3000'),
                RATE_LIMIT_WINDOW: Joi.string().default('15m'),
                RATE_LIMIT_MAX: Joi.number().default(100),
            }),
        }),
    ],
    providers: [ConfigService],
    exports: [NestConfigModule, ConfigService],
})
export class ConfigModule { }
