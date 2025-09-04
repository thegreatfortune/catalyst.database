import { Module } from '@nestjs/common'
import { ContentController } from './content.controller'
import { ContentService } from './content.service'
import { PointModule } from '../point/point.module'
import { SocialModule } from '../social/social.module'

@Module({
  imports: [SocialModule, PointModule],
  controllers: [ContentController],
  providers: [ContentService]
})
export class ContentModule { }
