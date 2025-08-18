import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type { IUserSocialAccount } from 'src/schemas/user.schema'
 
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  async findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Get('wallet/:address')
  async findByWalletAddress(@Param('address') address: string) {
    return this.userService.findByWalletAddress(address);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  // 社交账号相关接口
  @Post(':id/social-accounts')
  async addSocialAccount(
    @Param('id') id: string,
    @Body() socialAccount: IUserSocialAccount,
  ) {
    return this.userService.addSocialAccount(id, socialAccount);
  }

  @Delete(':id/social-accounts/:platform')
  async removeSocialAccount(
    @Param('id') id: string,
    @Param('platform') platform: string,
  ) {
    return this.userService.removeSocialAccount(id, platform);
  }

  @Get(':id/social-accounts/:platform')
  async getSocialAccount(
    @Param('id') id: string,
    @Param('platform') platform: string,
  ) {
    const user = await this.userService.findById(id);
    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.NOT_FOUND);
    }

    const socialAccount = user.socialAccounts?.find(
      (account) => account.platform === platform,
    );
    if (!socialAccount) {
      throw new HttpException(
        `未找到绑定的${platform}账号`,
        HttpStatus.NOT_FOUND,
      );
    }

    return socialAccount;
  }

  @Patch(':id/social-accounts/:platform')
  async updateSocialAccount(
    @Param('id') id: string,
    @Param('platform') platform: string,
    @Body() updateData: Partial<IUserSocialAccount>,
  ) {
    return this.userService.updateSocialAccountConnectionStatus(
      id,
      platform,
      updateData,
    );
  }
}
