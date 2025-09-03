import { Module } from '@nestjs/common'
import { UserService } from './user.service'
import { UserController } from './user.controller'
import { RefreshTokenService } from './refresh-token.service'

@Module({
  controllers: [UserController],
  providers: [UserService, RefreshTokenService],
  exports: [UserService],
})
export class UserModule { }
