import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { SocialOperationLog, SocialOperationLogSchema } from '../schemas/log.schema'
import { LogService } from './log.service'
import { LogController } from './log.controller'

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: SocialOperationLog.name, schema: SocialOperationLogSchema },
        ]),
    ],
    providers: [LogService],
    controllers: [LogController],
    exports: [LogService],
})
export class LogModule { }
