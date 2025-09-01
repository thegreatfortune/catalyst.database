import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { UserService } from './user.service'
import { UserController } from './user.controller'
import { User, UserSchema } from '../schemas/user.schema'
import { RefreshTokenService } from './refresh-token.service'
import { Point, PointSchema } from '../schemas/point.schema'
import { Social, SocialSchema } from '../schemas/social.schema'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Point.name, schema: PointSchema }]),
    MongooseModule.forFeature([{ name: Social.name, schema: SocialSchema }]),
  ],
  controllers: [UserController],
  providers: [UserService, RefreshTokenService],
  exports: [UserService],
})
export class UserModule { }
