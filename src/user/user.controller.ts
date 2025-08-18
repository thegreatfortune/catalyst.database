import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserSocialAccountDto } from './dto/create-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // 基本CRUD操作
  @Get()
  async findAll() {
    const users = await this.userService.findAll();
    return users;
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return await this.userService.findById(id);
  }

  @Get('wallet/:address')
  async findByWalletAddress(@Param('address') walletAddress: string) {
    return await this.userService.findByWalletAddress(walletAddress);
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.userService.create(createUserDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.userService.update(id, updateUserDto);
    if (!user) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: `User with ID ${id} not found`,
      };
    }
    return user;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const user = await this.userService.remove(id);
    if (!user) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: `User with ID ${id} not found`,
      };
    }
    return {
      statusCode: HttpStatus.OK,
      message: 'User deleted successfully',
      data: user,
    };
  }

  // 认证相关端点
  @Post('nonce')
  async updateNonce(@Body() body: { walletAddress: string }) {
    const nonce = await this.userService.updateNonce(body.walletAddress);
    return { nonce };
  }

  @Post('signature')
  async updateSignature(
    @Body()
    body: {
      walletAddress: string;
      signature: string;
      signedAt?: string;
    },
  ) {
    const user = await this.userService.updateSignature(
      body.walletAddress,
      body.signature,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Signature updated successfully',
      data: user,
    };
  }

  @Post('verify-nonce')
  async verifyNonce(@Body() body: { walletAddress: string; nonce: string }) {
    const isValid = await this.userService.verifyNonce(
      body.walletAddress,
      body.nonce,
    );
    return {
      isValid,
      message: isValid
        ? 'Nonce verified successfully'
        : 'Invalid nonce provided',
    };
  }

  // 钱包相关端点
  @Get('chain/:chainType')
  async findUsersByChainType(@Param('chainType') chainType: string) {
    const users = await this.userService.findUsersByChainType(chainType);
    return users;
  }

  // 社交账号管理端点
  @Post(':id/social-account')
  async addSocialAccount(
    @Param('id') userId: string,
    @Body() socialAccount: UserSocialAccountDto,
  ) {
    const user = await this.userService.addSocialAccount(userId, socialAccount);
    return user;
  }

  @Delete(':id/social-account/:platform')
  async removeSocialAccount(
    @Param('id') userId: string,
    @Param('platform') platform: string,
  ) {
    const user = await this.userService.removeSocialAccount(userId, platform);
    return {
      statusCode: HttpStatus.OK,
      message: `Social account ${platform} removed successfully`,
      data: user,
    };
  }

  @Get('social/:platform/:accountId')
  async findUserBySocialAccount(
    @Param('platform') platform: string,
    @Param('accountId') accountId: string,
  ) {
    const user = await this.userService.findUserBySocialAccount(
      platform,
      accountId,
    );
    if (!user) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: `User with social account ${platform}:${accountId} not found`,
      };
    }
    return user;
  }

  @Put(':id/social-account/:platform/connection')
  async updateSocialAccountConnectionStatus(
    @Param('id') userId: string,
    @Param('platform') platform: string,
    @Body() body: { isConnected: boolean },
  ) {
    const user = await this.userService.updateSocialAccountConnectionStatus(
      userId,
      platform,
      body.isConnected,
    );
    return user;
  }

  // 用于catalyst-server的查找或创建用户功能
  @Post('find-or-create')
  async findOrCreateUser(@Body() createUserDto: CreateUserDto) {
    // 先尝试查找用户
    let user = await this.userService.findByWalletAddress(
      createUserDto.walletAddress,
    );

    // 如果用户不存在，则创建新用户
    if (!user) {
      user = await this.userService.create(createUserDto);
    }

    return user;
  }
}
