import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AddSocialAccountDto } from './dto/add-social-account.dto';
import { UpdateSocialAccountDto } from './dto/update-social-account.dto';
import { SocialAccount } from '../schemas/user.schema';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      return this.userService.create(createUserDto);
    } catch (error) {
      throw new InternalServerErrorException('创建用户失败');
    }
  }

  @Get()
  async findAll() {
    try {
      return this.userService.findAll();
    } catch (error) {
      throw new InternalServerErrorException('查询用户失败');
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return this.userService.findById(id);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('查询用户失败');
    }
  }

  @Get('wallet/:address')
  async findByWalletAddress(@Param('address') address: string) {
    try {
      return this.userService.findByWalletAddress(address);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('查询用户失败');
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    try {
      return this.userService.update(id, updateUserDto);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('更新用户失败');
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return this.userService.remove(id);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('删除用户失败');
    }
  }

  // 社交账号相关接口
  @Post(':id/social-account')
  async addSocialAccount(
    @Param('id') id: string,
    @Body() addSocialAccountDto: AddSocialAccountDto,
  ) {
    try {
      return this.userService.addSocialAccount(
        id,
        addSocialAccountDto.platform,
        addSocialAccountDto.socialAccountDto,
        addSocialAccountDto.socialAccountTokenStateDto,
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('添加社交账号失败');
    }
  }

  @Delete(':id/social-account/:platform')
  async removeSocialAccount(
    @Param('id') id: string,
    @Param('platform') platform: string,
  ) {
    if (platform !== 'twitter') {
      throw new BadRequestException('不支持的社媒平台');
    }
    try {
      return this.userService.removeSocialAccount(id, platform);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('删除社交账号失败');
    }
  }

  @Get(':id/social-account/:platform')
  async getSocialAccount(
    @Param('id') id: string,
    @Param('platform') platform: string,
  ): Promise<SocialAccount> {
    if (platform !== 'twitter') {
      throw new BadRequestException('不支持的社媒平台');
    }
    try {
      const user = await this.userService.findById(id);

      const socialAccount = user.socialAccounts?.find(
        (account) => account.platform === platform && account.isConnected,
      );
      if (!socialAccount) {
        throw new NotFoundException(`未找到绑定的${platform}账号`);
      }

      return socialAccount;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `获取用户 ${id} 的 ${platform} 账号失败`,
      );
    }
  }

  @Patch(':id/social-account/:platform')
  async updateSocialAccount(
    @Param('id') id: string,
    @Param('platform') platform: string,
    @Body() updateData: UpdateSocialAccountDto,
  ) {
    // 验证平台类型
    if (!['twitter', 'instagram', 'rednote', 'facebook'].includes(platform)) {
      throw new BadRequestException('不支持的社交媒体平台');
    }

    try {
      // 确保updateData中的platform与URL参数一致
      if (updateData.platform && updateData.platform !== platform) {
        throw new BadRequestException('请求体中的platform必须与URL参数一致');
      }

      // 设置platform以确保一致性
      updateData.platform = platform as
        | 'twitter'
        | 'instagram'
        | 'rednote'
        | 'facebook';

      const updatedUser = await this.userService.updateSocialAccount(
        id,
        platform,
        updateData,
      );

      return {
        success: true,
        message: `成功更新用户 ${id} 的 ${platform} 账号信息`,
        data: updatedUser,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `更新用户 ${id} 的 ${platform} 账号信息失败`,
      );
    }
  }

  @Get('random/:platform')
  async getRandomUserWithToken(@Param('platform') platform: string) {
    if (platform !== 'twitter') {
      throw new BadRequestException('不支持的社媒平台');
    }

    try {
      const userId = await this.userService.findRandomUserIdWithToken(platform);
      if (!userId) {
        throw new NotFoundException('未找到绑定Twitter账号且有有效Token的用户');
      }
      return userId;
    } catch (error) {
      throw new InternalServerErrorException(
        `查询随机用户失败: ${error.message}`,
      );
    }
  }
}
