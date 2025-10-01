import { Module } from '@nestjs/common'
import { ContentController } from './content.controller'
import { ContentService } from './content.service'
import { CreditModule } from '../credit/credit.module'
import { SocialModule } from '../social/social.module'
import { SocialAuthModule } from '../social-auth/social-auth.module'
import { FundsModule } from '../funds/funds.module'
import { ConfigModule } from '../config/config.module'
import { TransactionModule } from '../transaction/transaction.module'

@Module({
  imports: [ConfigModule, SocialModule, SocialAuthModule, FundsModule, CreditModule, TransactionModule],
  controllers: [ContentController],
  providers: [ContentService]
})
export class ContentModule { }
