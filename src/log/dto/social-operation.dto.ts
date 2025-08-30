import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsEnum, IsOptional, IsBoolean, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

import {
    SocialOperationType,
    SocialOperationStatus,
    SocialOperationContent,
    SocialOperationResult,
    SocialOperationCompensation
} from '../../schemas/log.schema'
import { SocialProvider } from '../../schemas/user.schema'

export class CreateSocialOperationLogDto {
    @ApiProperty({ description: '用户ID' })
    @IsString()
    userId: string

    @ApiProperty({
        description: '操作类型',
        enum: SocialOperationType,
        example: SocialOperationType.TWEET
    })
    @IsEnum(SocialOperationType)
    operationType: SocialOperationType

    @ApiProperty({
        description: '社交媒体提供商',
        enum: SocialProvider,
        example: SocialProvider.X
    })
    @IsEnum(SocialProvider)
    provider: SocialProvider

    @ApiProperty({ description: '操作内容' })
    @ValidateNested()
    @Type(() => SocialOperationContent)
    content: SocialOperationContent

    @ApiPropertyOptional({ description: '是否匿名操作', default: false })
    @IsBoolean()
    @IsOptional()
    anonymous?: boolean
}

export class UpdateOperationResultDto {
    @ApiProperty({ description: '操作结果' })
    @ValidateNested()
    @Type(() => SocialOperationResult)
    result: SocialOperationResult

    @ApiPropertyOptional({
        description: '操作状态',
        enum: SocialOperationStatus,
        default: SocialOperationStatus.COMPLETED
    })
    @IsEnum(SocialOperationStatus)
    @IsOptional()
    status?: SocialOperationStatus
}

export class RecordCompensationDto {
    @ApiProperty({ description: '补偿操作详情' })
    @ValidateNested()
    @Type(() => SocialOperationCompensation)
    compensation: SocialOperationCompensation
}

export class SocialOperationResponseDto {
    @ApiProperty({ description: '操作日志ID' })
    _id: string

    @ApiProperty({ description: '用户ID' })
    userId: string

    @ApiProperty({
        description: '操作类型',
        enum: SocialOperationType
    })
    operationType: SocialOperationType

    @ApiProperty({
        description: '社交媒体提供商',
        enum: SocialProvider
    })
    provider: SocialProvider

    @ApiProperty({
        description: '操作状态',
        enum: SocialOperationStatus
    })
    status: SocialOperationStatus

    @ApiProperty({ description: '操作内容' })
    content: SocialOperationContent

    @ApiPropertyOptional({ description: '操作结果' })
    result?: SocialOperationResult

    @ApiPropertyOptional({ description: '补偿操作' })
    compensation?: SocialOperationCompensation

    @ApiProperty({ description: '重试次数' })
    retryCount: number

    @ApiProperty({ description: '是否匿名操作' })
    anonymous: boolean

    @ApiProperty({ description: '创建时间' })
    createdAt: Date

    @ApiProperty({ description: '更新时间' })
    updatedAt: Date
}
