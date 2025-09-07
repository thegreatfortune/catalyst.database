import { Global, Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { SocialAuth, SocialAuthSchema } from '../schemas/social-auth.schema'
import { Social, SocialSchema } from '../schemas/social.schema'
import { User, UserSchema } from '../schemas/user.schema'
import { Credit, CreditSchema, CreditTransaction, CreditTransactionSchema } from '../schemas/credit.schema'
import { Content, ContentSchema } from '../schemas/content.schema'
import { AnonymousIdentity, AnonymousIdentitySchema } from '../schemas/anonymout-identity.schema'


@Global()
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: Social.name, schema: SocialSchema },
            { name: SocialAuth.name, schema: SocialAuthSchema },
            { name: AnonymousIdentity.name, schema: AnonymousIdentitySchema },
            { name: Credit.name, schema: CreditSchema },
            { name: Content.name, schema: ContentSchema },
            { name: CreditTransaction.name, schema: CreditTransactionSchema },
        ]),
    ],
    exports: [MongooseModule]
})
export class DatabaseModule {
}
