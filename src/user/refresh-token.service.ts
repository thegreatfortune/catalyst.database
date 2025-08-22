import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { RefreshTokenInfo, User } from '../schemas/user.schema'
import { PlatformType } from './dto/refresh-token.dto'

const maxAgeMs = 30 * 24 * 60 * 60 * 1000 // 30天

@Injectable()
export class RefreshTokenService {
    private readonly logger = new Logger(RefreshTokenService.name);

    constructor(@InjectModel(User.name) private userModel: Model<User>) { }

    /**
     * 创建或更新用户的刷新令牌
     * @param userId 用户ID
     * @param token 刷新令牌
     * @param platform 平台信息
     * @returns 创建或更新后的用户对象
     */
    async create(
        userId: string,
        token: string,
        platformType: PlatformType = PlatformType.Mobile,
    ): Promise<User> {
        try {
            this.logger.log(`为用户 ${userId} 创建或更新刷新令牌`)

            // 先检查用户是否已经有该平台的令牌
            const user = await this.userModel.findById(userId).exec()
            if (!user) {
                throw new NotFoundException(`用户 ${userId} 不存在`)
            }

            // 初始化 refreshTokens 数组（如果不存在）
            if (!user.refreshTokens) {
                user.refreshTokens = []
            }

            // 检查是否已经存在该平台的令牌
            const existingTokenIndex = user.refreshTokens.findIndex(
                rt => rt.platformType === platformType
            )

            if (existingTokenIndex >= 0) {
                // 更新已存在的令牌
                user.refreshTokens[existingTokenIndex] = {
                    token,
                    platformType,
                    issuedAt: new Date(),
                }
            } else {
                // 添加新的刷新令牌
                user.refreshTokens.push({
                    token,
                    platformType,
                    issuedAt: new Date(),
                })
            }

            return user.save()
        } catch (error) {
            this.logger.error(`创建刷新令牌失败: ${error.message}`, error.stack)
            throw error
        }
    }





    /**
     * 验证刷新令牌是否有效
     * @param token 刷新令牌
     * @param userId 用户ID
     * @param platformType 平台类型
     * @returns boolean
     */
    async isValid(token: string, userId: string, platformType: PlatformType): Promise<boolean> {
        try {
            this.logger.log(`查找用户 ${userId} 平台 ${platformType} 的刷新令牌`)

            const minValidDate = new Date(Date.now() - maxAgeMs)
            const user = await this.userModel
                .findOne({
                    _id: userId,
                    'refreshTokens.platformType': platformType,
                    'refreshTokens.issuedAt': { $gte: minValidDate }
                })
                .exec()

            if (!user) {
                throw new NotFoundException(`用户 ${userId} 不存在`)
            }

            const refreshToken = user.refreshTokens?.find(
                rt => rt.platformType === platformType
            )
            if (!refreshToken) {
                throw new NotFoundException(`用户 ${userId} 平台 ${platformType} 的刷新令牌不存在`)
            }

            if (refreshToken.token !== token) {
                return false
            }
            return true

        } catch (error) {
            this.logger.error(`查找刷新令牌失败: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 删除特定的刷新令牌
     * @param userId 用户ID
     * @param token 要删除的令牌
     * @returns 更新后的用户对象
     */
    async remove(userId: string, token: string): Promise<User> {
        try {
            this.logger.log(`删除用户 ${userId} 的刷新令牌`)

            const result = await this.userModel.findByIdAndUpdate(
                userId,
                { $pull: { refreshTokens: { token } } },
                { new: true }
            ).exec()

            if (!result) {
                throw new NotFoundException(`用户 ${userId} 不存在`)
            }

            return result
        } catch (error) {
            this.logger.error(`删除刷新令牌失败: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 删除用户的所有刷新令牌
     * @param userId 用户ID
     * @returns 更新后的用户对象
     */
    async removeAll(userId: string): Promise<User> {
        try {
            this.logger.log(`删除用户 ${userId} 的所有刷新令牌`)

            const result = await this.userModel.findByIdAndUpdate(
                userId,
                { $set: { refreshTokens: [] } },
                { new: true }
            ).exec()

            if (!result) {
                throw new NotFoundException(`用户 ${userId} 不存在`)
            }

            return result
        } catch (error) {
            this.logger.error(`删除所有刷新令牌失败: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 删除特定平台的所有刷新令牌
     * @param userId 用户ID
     * @param platform 平台
     * @returns 更新后的用户对象
     */
    async removeByPlatform(userId: string, platform: string): Promise<User> {
        try {
            this.logger.log(`删除用户 ${userId} 平台 ${platform} 的所有刷新令牌`)

            const result = await this.userModel.findByIdAndUpdate(
                userId,
                { $pull: { refreshTokens: { platform } } },
                { new: true }
            ).exec()

            if (!result) {
                throw new NotFoundException(`用户 ${userId} 不存在`)
            }
            return result
        } catch (error) {
            this.logger.error(`删除平台刷新令牌失败: ${error.message}`, error.stack)
            throw error
        }
    }
}
