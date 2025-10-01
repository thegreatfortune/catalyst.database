import { Global, Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { SocialAuth, SocialAuthSchema } from '../schemas/social-auth.schema'
import { Social, SocialSchema } from '../schemas/social.schema'
import { User, UserSchema } from '../schemas/user.schema'
import { Credit, CreditSchema, CreditTransaction, CreditTransactionSchema } from '../schemas/credit.schema'
import { Content, ContentSchema } from '../schemas/content.schema'
import { AnonymousIdentity, AnonymousIdentitySchema } from '../schemas/anonymout-identity.schema'
import { Funds, FundsSchema, FundsTransaction, FundsTransactionSchema } from '../schemas/funds.schema'
import { Transaction, TransactionSchema } from '../schemas/transaction.schema'


@Global()
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: Social.name, schema: SocialSchema },
            { name: SocialAuth.name, schema: SocialAuthSchema },
            { name: AnonymousIdentity.name, schema: AnonymousIdentitySchema },
            { name: Funds.name, schema: FundsSchema },
            { name: FundsTransaction.name, schema: FundsTransactionSchema },
            { name: Credit.name, schema: CreditSchema },
            { name: CreditTransaction.name, schema: CreditTransactionSchema },
            { name: Transaction.name, schema: TransactionSchema },
            { name: Content.name, schema: ContentSchema },
        ]),
    ],
    exports: [MongooseModule]
})
export class DatabaseModule {
}
