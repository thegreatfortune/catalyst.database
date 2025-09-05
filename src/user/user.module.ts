import { Module } from '@nestjs/common'
import { UserService } from './user.service'
import { UserController } from './user.controller'
import { RefreshTokenService } from './refresh-token.service'
import { PointModule } from 'src/point/point.module'

@Module({
  imports: [PointModule],
  controllers: [UserController],
  providers: [UserService, RefreshTokenService],
  exports: [UserService],
})
export class UserModule { }
