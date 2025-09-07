import { Module } from '@nestjs/common'
import { AnonymousIdentityController } from './anonymous-identity.controller'
import { AnonymousIdentityService } from './anonymous-identity.service'
import { MongooseModule } from '@nestjs/mongoose'
import { AnonymousIdentity, AnonymousIdentityDocument } from '../schemas/anonymout-identity.schema'
import { CreditModule } from 'src/credit/credit.module'

@Module({
  imports: [CreditModule],
  controllers: [AnonymousIdentityController],
  providers: [AnonymousIdentityService]
})
export class AnonymousIdentityModule { }
