import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { FundsController } from './funds.controller'
import { FundsService } from './funds.service'
import { ConfigModule } from '../config/config.module'

@Module({
    imports: [ConfigModule],
    controllers: [FundsController],
    providers: [FundsService],
    exports: [FundsService],
})
export class FundsModule { }
