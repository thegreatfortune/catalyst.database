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
     * 查找刷新令牌
     * @param token 刷新令牌字符串
     */
    async find(token: string): Promise<{ userId: string; tokenInfo: RefreshTokenInfo | null }>
    /**
     * 根据用户ID和平台类型查找刷新令牌
     * @param userId 用户ID
     * @param platformType 平台类型
     */
    async find(userId: string, platformType: PlatformType): Promise<{ userId: string; tokenInfo: RefreshTokenInfo | null }>
    async find(param1: string, param2?: PlatformType): Promise<{ userId: string; tokenInfo: RefreshTokenInfo | null }> {
        try {
            if (typeof param2 === 'undefined') {
                // 第一个重载：通过token查找
                this.logger.log(`通过token查找刷新令牌`)
                // 计算最早有效时间
                const minValidDate = new Date(Date.now() - maxAgeMs)
                const token = param1
                const user = await this.userModel
                    .findOne(
                        {
                            'refreshTokens.token': token,
                            'refreshTokens.issuedAt': { $gte: minValidDate }
                        },
                        { 'refreshTokens.$': 1 },
                    )
                    .exec()

                if (!user) {
                    throw new NotFoundException(`用户不存在`)
                }

                return {
                    userId: user._id.toString(),
                    tokenInfo: user.refreshTokens && user.refreshTokens.length > 0
                        ? user.refreshTokens[0]
                        : null,
                }
            } else {
                // 第二个重载：通过userId和platformType查找
                const userId = param1
                const platformType = param2
                this.logger.log(`查找用户 ${userId} 平台 ${platformType} 的刷新令牌`)

                const user = await this.userModel
                    .findOne({ _id: userId })
                    .exec()

                if (!user) {
                    throw new NotFoundException(`用户不存在`)
                }

                const refreshToken = user.refreshTokens?.find(
                    rt => rt.platformType === platformType
                )

                return {
                    userId: user._id.toString(),
                    tokenInfo: refreshToken || null
                }
            }
        } catch (error) {
            this.logger.error(`查找刷新令牌失败: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 更新刷新令牌（用于令牌轮换）
     * @param oldToken 旧令牌
     * @param newToken 新令牌
     * @returns 更新后的用户对象
     */
    async update(oldToken: string, newToken: string): Promise<User> {
        try {
            this.logger.log(`更新刷新令牌`)

            // 使用 MongoDB 的原子操作，一次性完成查找和更新
            const result = await this.userModel.findOneAndUpdate(
                { 'refreshTokens.token': oldToken },
                {
                    $set: {
                        'refreshTokens.$.token': newToken,
                        'refreshTokens.$.issuedAt': new Date()
                    }
                },
                { new: true } // 返回更新后的文档
            ).exec()

            if (!result) {
                throw new NotFoundException('刷新令牌不存在或已过期')
            }

            return result
        } catch (error) {
            this.logger.error(`更新刷新令牌失败: ${error.message}`, error.stack)
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
