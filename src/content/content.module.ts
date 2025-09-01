import { Module } from '@nestjs/common'
import { ContentController } from './content.controller'
import { ContentService } from './content.service'
import { MongooseModule } from '@nestjs/mongoose'
import { Content, ContentSchema } from '../schemas/content.schema'

import { PointModule } from 'src/point/point.module'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Content.name, schema: ContentSchema },
    ]),
    PointModule
  ],
  controllers: [ContentController],
  providers: [ContentService]
})
export class ContentModule { }
