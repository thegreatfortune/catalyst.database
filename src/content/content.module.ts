import { Module } from '@nestjs/common'
import { ContentController } from './content.controller'
import { ContentService } from './content.service'
import { CreditModule } from '../credit/credit.module'
import { SocialModule } from '../social/social.module'
import { SocialAuthModule } from '../social-auth/social-auth.module'

@Module({
  imports: [SocialModule, SocialAuthModule, CreditModule],
  controllers: [ContentController],
  providers: [ContentService]
})
export class ContentModule { }
