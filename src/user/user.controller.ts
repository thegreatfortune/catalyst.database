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
  Query,
} from '@nestjs/common'
import { UserService } from './user.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { AddSocialAccountDto } from './dto/add-social-account.dto'
import { UpdateSocialAccountDto } from './dto/update-social-account.dto'
import { SocialAccount, SocialAccountTokenState, SocialProvider, User } from '../schemas/user.schema'
import { RefreshTokenService } from './refresh-token.service'
import { CreateRefreshTokenDto, FindRefreshTokenDto, RemoveRefreshTokenDto, UpdateRefreshTokenDto } from './dto/refresh-token.dto'
import { UpdateSocialAccountTokenStateDto } from './dto/update-social-account-token-state.dto'

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly refreshTokenService: RefreshTokenService,
  ) { }

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      const user = await this.userService.create(createUserDto)
      return user
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error
      }
      throw new InternalServerErrorException('创建用户失败')
    }
  }

  /**
 * 根据token或userId和deviceType查找刷新令牌
 * @param query token或userId和deviceType
 * @returns 
 */
  @Get('refresh-token')
  async findRefreshToken(@Query() query: FindRefreshTokenDto) {
    try {
      const { token, deviceType } = query
      console.log('findRefreshToken', token, deviceType)
      return await this.refreshTokenService.find(token, deviceType)
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error
      }
      throw new InternalServerErrorException(
        `获取刷新令牌失败: ${error.message}`,
      )
    }
  }

  /**
   * 创建刷新令牌
   * @param body userId, token, deviceType
   * @returns 
   */
  @Post('refresh-token')
  async createRefreshToken(@Body() body: CreateRefreshTokenDto) {
    try {
      const { userId, token, deviceType } = body
      return this.refreshTokenService.create(userId, token, deviceType)
    } catch (error) {
      throw new InternalServerErrorException(
        `创建刷新令牌失败: ${error.message}`,
      )
    }
  }


  @Delete('refresh-token')
  async removeRefreshToken(@Body() body: RemoveRefreshTokenDto) {
    try {
      const { userId, token } = body
      return this.refreshTokenService.remove(userId, token)
    } catch (error) {
      throw new InternalServerErrorException(
        `删除刷新令牌失败: ${error.message}`,
      )
    }
  }

  @Get('wallet/:address/:chainId')
  async findByWalletAddress(@Param('address') address: string, @Param('chainId') chainId: number) {
    try {
      return this.userService.findByWalletAddress(address, Number(chainId))
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error
      }
      throw new InternalServerErrorException('查询用户失败')
    }
  }

  @Get('random/:provider')
  async getRandomUserWithToken(@Param('provider') provider: SocialProvider) {
    if (provider !== SocialProvider.X) {
      throw new BadRequestException('不支持的社媒平台')
    }

    try {
      const userId = await this.userService.findRandomUserIdWithToken(provider)
      if (!userId) {
        throw new NotFoundException('未找到绑定Twitter账号且有有效Token的用户')
      }
      return userId
    } catch (error) {
      throw new InternalServerErrorException(
        `查询随机用户失败: ${error.message}`,
      )
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return this.userService.findById(id)
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error
      }
      throw new InternalServerErrorException('查询用户失败')
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    try {
      console.log('database update updateUserDto:', updateUserDto)
      return this.userService.update(id, updateUserDto)
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error
      }
      throw new InternalServerErrorException('更新用户失败')
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return this.userService.remove(id)
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error
      }
      throw new InternalServerErrorException('删除用户失败')
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
        addSocialAccountDto.provider,
        addSocialAccountDto.socialAccountAddDto,
        addSocialAccountDto.socialAccountTokenStateAddDto,
      )
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error
      }
      throw new InternalServerErrorException('添加社交账号失败')
    }
  }

  @Delete(':id/social-account/:provider')
  async removeSocialAccount(
    @Param('id') id: string,
    @Param('provider') provider: SocialProvider,
  ) {
    if (provider !== SocialProvider.X) {
      throw new BadRequestException('不支持的社媒平台')
    }
    try {
      return this.userService.removeSocialAccount(id, provider)
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error
      }
      throw new InternalServerErrorException('删除社交账号失败')
    }
  }

  @Get(':id/social-account/:provider')
  async getSocialAccount(
    @Param('id') id: string,
    @Param('provider') provider: SocialProvider,
  ): Promise<SocialAccount> {
    if (provider !== SocialProvider.X) {
      throw new BadRequestException('不支持的社媒平台')
    }
    try {
      const user = await this.userService.findById(id)

      const socialAccount = user.socialAccounts?.find(
        (account) => account.provider === provider && account.isConnected,
      )
      if (!socialAccount) {
        throw new NotFoundException(`未找到绑定的${provider}账号`)
      }

      return socialAccount
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error
      }
      throw new InternalServerErrorException(
        `获取用户 ${id} 的 ${provider} 账号失败`,
      )
    }
  }

  @Get(':id/social-account/:provider/token-state')
  async getSocialAccountTokenState(
    @Param('id') id: string,
    @Param('provider') provider: SocialProvider,
  ): Promise<SocialAccountTokenState> {
    if (provider !== SocialProvider.X) {
      throw new BadRequestException('不支持的社媒平台')
    }
    try {
      const user = await this.userService.findById(id)

      const socialAccountTokenState = user.socialAccountTokenStates?.find(
        (tokenState) => tokenState.provider === provider,
      )
      if (!socialAccountTokenState) {
        throw new NotFoundException(`未找到绑定的${provider}账号`)
      }

      return socialAccountTokenState
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error
      }
      throw new InternalServerErrorException(
        `获取用户 ${id} 的 ${provider} 账号失败`,
      )
    }
  }

  @Patch(':id/social-account')
  async updateSocialAccount(
    @Param('id') id: string,
    @Body() updateData: UpdateSocialAccountDto,
  ) {
    // 验证平台类型
    if (!Object.values(SocialProvider).includes(updateData.provider)) {
      throw new BadRequestException('不支持的社交媒体平台')
    }

    try {
      const updatedUser = await this.userService.updateSocialAccount(
        id,
        updateData.provider,
        updateData,
      )

      return {
        success: true,
        message: `成功更新用户 ${id} 的 ${updateData.provider} 账号信息`,
        data: updatedUser,
      }
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error
      }
      throw new InternalServerErrorException(
        `更新用户 ${id} 的 ${updateData.provider} 账号信息失败`,
      )
    }
  }

  @Patch(':id/social-account/:provider/last-used-at')
  async updateSocialAccountLastUsedAt(
    @Param('id') id: string,
    @Param('provider') provider: SocialProvider,
  ) {
    try {
      return this.userService.updateSocialAccountLastUsedAt(id, provider)
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error
      }
      throw new InternalServerErrorException(
        `更新用户 ${id} 的 ${provider} 账号信息失败`,
      )
    }
  }

  @Patch(':id/social-account/:provider/token-state')
  async updateSocialAccountTokenState(
    @Param('id') id: string,
    @Param('provider') provider: SocialProvider,
    @Body() updateData: UpdateSocialAccountTokenStateDto
  ): Promise<User> {
    try {
      return this.userService.updateSocialAccountTokenState(id, provider, updateData)
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error
      }
      throw new InternalServerErrorException(
        `更新用户 ${id} 的 ${provider} 账号令牌状态失败: ${error.message}`
      )
    }
  }
}
