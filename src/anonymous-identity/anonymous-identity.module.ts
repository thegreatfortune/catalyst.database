import { Module } from '@nestjs/common'
import { AnonymousIdentityController } from './anonymous-identity.controller'
import { AnonymousIdentityService } from './anonymous-identity.service'
import { MongooseModule } from '@nestjs/mongoose'
import { AnonymousIdentity, AnonymousIdentityDocument } from '../schemas/anonymout-identity.schema'
import { CreditModule } from '../credit/credit.module'
import { TransactionModule } from '../transaction/transaction.module'

@Module({
  imports: [CreditModule, TransactionModule],
  controllers: [AnonymousIdentityController],
  providers: [AnonymousIdentityService]
})
export class AnonymousIdentityModule { }
