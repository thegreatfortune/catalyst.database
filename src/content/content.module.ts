import { Module } from '@nestjs/common'
import { ContentController } from './content.controller'
import { ContentService } from './content.service'
import { PointModule } from '../point/point.module'

@Module({
  imports: [PointModule],
  controllers: [ContentController],
  providers: [ContentService]
})
export class ContentModule { }
