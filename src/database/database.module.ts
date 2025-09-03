import { Global, Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { SocialAuth, SocialAuthSchema, XAuthSchema } from '../schemas/social-auth.schema'
import { Social, SocialSchema, XUserSchema } from '../schemas/social.schema'
import { User, UserSchema, SocialProvider } from '../schemas/user.schema'
import { Point, PointSchema, PointTransaction, PointTransactionSchema } from '../schemas/point.schema'
import { Content, ContentSchema } from '../schemas/content.schema'
import mongoose from 'mongoose'


@Global()
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: Social.name, schema: SocialSchema },
            { name: SocialAuth.name, schema: SocialAuthSchema },
            { name: Point.name, schema: PointSchema },
            { name: Content.name, schema: ContentSchema },
            { name: PointTransaction.name, schema: PointTransactionSchema }
        ]),
    ],
    exports: [MongooseModule]
})
export class DatabaseModule {
}
