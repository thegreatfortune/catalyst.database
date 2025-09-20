import { Module } from '@nestjs/common'
import { CreditController } from './credit.controller'
import { CreditService } from './credit.service'
import { ConfigModule } from '../config/config.module'

@Module({
  imports: [ConfigModule],
  controllers: [CreditController],
  providers: [CreditService],
  exports: [CreditService]
})
export class CreditModule { }
