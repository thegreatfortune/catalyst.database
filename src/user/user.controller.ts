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
import { RefreshTokenService } from './refresh-token.service'
import { CreateRefreshTokenDto, FindRefreshTokenDto, RemoveRefreshTokenDto } from './dto/refresh-token.dto'
import { GetContributorDto } from './dto/get-contributor.dto'
import { FindByWalletAddressDto } from './dto/find-by-walletaddress.dto'
import { Contributor, UserInfo } from './dto/reponse.dto'

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly refreshTokenService: RefreshTokenService,
  ) { }

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<UserInfo> {
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

  @Get()
  async findByWalletAddress(@Query() fbwaDto: FindByWalletAddressDto): Promise<UserInfo> {
    const { walletAddress, chainId } = fbwaDto
    try {
      return this.userService.findByWalletAddress(walletAddress, Number(chainId))
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error
      }
      throw new InternalServerErrorException(`Find user by wallet address failed: ${error.message}`)
    }
  }

  @Get('contributors')
  async getContributors(@Query() gcDto: GetContributorDto): Promise<string[]> {
    try {
      const { excludedUserId, provider, count } = gcDto
      const userId = await this.userService.findContributorIds(excludedUserId, provider, count)
      if (!userId) {
        throw new NotFoundException('未找到绑定X账号且有有效Token的用户')
      }
      return userId
    } catch (error) {
      throw new InternalServerErrorException(
        `查询随机用户失败: ${error.message}`,
      )
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserInfo> {
    try {
      return this.userService.findById(id)
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error
      }
      throw new InternalServerErrorException(`Find user by id failed: ${error.message}`)
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<UserInfo> {
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
}
