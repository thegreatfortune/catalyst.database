import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    Logger,
} from '@nestjs/common'
import { LogService } from './log.service'
import {
    SocialOperationLogDocument,
    SocialOperationType,
    SocialOperationStatus,
    SocialOperationContent,
    SocialOperationResult,
    SocialOperationCompensation,
} from '../schemas/log.schema'

import { SocialProvider } from '../schemas/user.schema'


@Controller('log')
export class LogController {
    private readonly logger = new Logger(LogController.name)

    constructor(private readonly logService: LogService) { }

    @Post('social-operation')
    async createSocialOperationLog(
        @Body()
        data: {
            userId: string
            operationType: SocialOperationType
            provider: SocialProvider
            content: SocialOperationContent
            anonymous?: boolean
        },
    ): Promise<SocialOperationLogDocument> {
        return this.logService.createSocialOperationLog(
            data.userId,
            data.operationType,
            data.provider,
            data.content,
            data.anonymous,
        )
    }

    @Post('social-operation/:id/result')
    async updateOperationResult(
        @Param('id') id: string,
        @Body()
        data: {
            result: SocialOperationResult
            status?: SocialOperationStatus
        },
    ): Promise<SocialOperationLogDocument> {
        return this.logService.updateOperationResult(
            id,
            data.result,
            data.status || SocialOperationStatus.COMPLETED,
        )
    }

    @Post('social-operation/:id/compensation')
    async recordCompensation(
        @Param('id') id: string,
        @Body() compensation: SocialOperationCompensation,
    ): Promise<SocialOperationLogDocument> {
        return this.logService.recordCompensation(id, compensation)
    }

    @Post('social-operation/:id/retry')
    async incrementRetryCount(
        @Param('id') id: string,
    ): Promise<SocialOperationLogDocument> {
        return this.logService.incrementRetryCount(id)
    }

    @Get('social-operation/pending')
    async findPendingOperations(
        @Query('limit') limit?: number,
        @Query('skipMinutes') skipMinutes?: number,
    ): Promise<SocialOperationLogDocument[]> {
        return this.logService.findPendingOperations(
            limit ? parseInt(limit.toString()) : undefined,
            skipMinutes ? parseInt(skipMinutes.toString()) : undefined,
        )
    }

    @Get('social-operation/tweet/:tweetId')
    async findByTweetId(
        @Param('tweetId') tweetId: string,
    ): Promise<SocialOperationLogDocument | null> {
        return this.logService.findByTweetId(tweetId)
    }

    @Get('social-operation/user/:userId')
    async getUserOperationHistory(
        @Param('userId') userId: string,
        @Query('limit') limit?: number,
        @Query('skip') skip?: number,
    ): Promise<SocialOperationLogDocument[]> {
        return this.logService.getUserOperationHistory(
            userId,
            limit ? parseInt(limit.toString()) : undefined,
            skip ? parseInt(skip.toString()) : undefined,
        )
    }
}
