import { Injectable } from '@nestjs/common'
import { ConfigService as NestConfigService } from '@nestjs/config'

/**
 * 应用配置服务
 * 封装原生ConfigService，提供类型安全的配置访问方法
 */
@Injectable()
export class ConfigService {
    constructor(private nestConfigService: NestConfigService) { }

    // 服务器配置
    get port(): number {
        return this.getNumber('PORT', 3001)
    }

    get nodeEnv(): 'development' | 'production' | 'test' {
        return this.getString('NODE_ENV', 'development') as
            | 'development'
            | 'production'
            | 'test'
    }

    // MongoDB配置
    get mongodbUri(): string {
        return this.getStringOrThrow('MONGODB_URI')
    }

    get mongodbUser(): string | undefined {
        return this.getString('MONGODB_USER', '')
    }

    get mongodbPassword(): string | undefined {
        return this.getString('MONGODB_PASSWORD', '')
    }

    get mongodbAppName(): string | undefined {
        return this.getString('MONGODB_APPNAME', '')
    }

    // 构建完整的MongoDB连接字符串
    get mongodbConnectionString(): string {
        // 如果直接提供了完整的URI，则直接使用
        if (this.mongodbUri.includes('mongodb://') || this.mongodbUri.includes('mongodb+srv://')) {
            return this.mongodbUri
        }

        // 否则构建连接字符串
        const credentials = this.mongodbUser && this.mongodbPassword
            ? `${encodeURIComponent(this.mongodbUser)}:${encodeURIComponent(this.mongodbPassword)}@`
            : ''

        const appName = this.mongodbAppName ? `/${this.mongodbAppName}` : ''

        const options = new URLSearchParams({
            retryWrites: 'true',
            w: 'majority',
            appName: appName,
        }).toString()

        return `mongodb+srv://${credentials}${this.mongodbUri}?${options}`
    }

    get upstashRedisRestUrl(): string {
        return this.getStringOrThrow('UPSTASH_REDIS_REST_URL')
    }

    get upstashRedisRestToken(): string {
        return this.getStringOrThrow('UPSTASH_REDIS_REST_TOKEN')
    }


    // 安全配置
    get corsOrigins(): string[] {
        return this.getString('CORS_ORIGINS', 'http://localhost:3000').split(',')
    }

    get rateLimitWindow(): string {
        return this.getString('RATE_LIMIT_WINDOW', '15m')
    }

    get rateLimitMax(): number {
        return this.getNumber('RATE_LIMIT_MAX', 100)
    }

    get fundRate(): number {
        return this.getNumber('FUND_RATE', 40)
    }

    // 辅助方法
    private getString(key: string, defaultValue: string): string {
        const value = this.nestConfigService.get<string>(key)
        return value !== undefined ? value : defaultValue
    }

    private getStringOrThrow(key: string): string {
        const value = this.nestConfigService.get<string>(key)
        if (value === undefined) {
            throw new Error(`配置项 ${key} 未定义`)
        }
        return value
    }

    private getNumber(key: string, defaultValue?: number): number {
        const value = this.nestConfigService.get<number>(key)
        return value !== undefined ? value : (defaultValue as number)
    }

    private getBoolean(key: string, defaultValue?: boolean): boolean {
        const value = this.nestConfigService.get<boolean>(key)
        return value !== undefined ? value : (defaultValue as boolean)
    }
}
