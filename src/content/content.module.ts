import { Module } from '@nestjs/common'
import { ContentController } from './content.controller'
import { ContentService } from './content.service'
import { MongooseModule } from '@nestjs/mongoose'
import { Content, ContentSchema } from '../schemas/content.schema'
import { User, UserSchema } from '../schemas/user.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Content.name, schema: ContentSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ContentController],
  providers: [ContentService]
})
export class ContentModule { }
