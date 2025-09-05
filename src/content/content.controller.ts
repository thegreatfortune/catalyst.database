import { BadRequestException, Body, Controller, Get, InternalServerErrorException, NotFoundException, Patch, Post, Query } from '@nestjs/common'
import { ContentService } from './content.service'
import { CreateContentDto } from './dto/create-content.dto'
import { PublishContentDto, UpdateRawDto } from './dto/update-content.dto'
import { GetContentsDto } from './dto/get-contents.dto'

@Controller('content')
export class ContentController {
    constructor(
        private readonly contentService: ContentService,
    ) { }

    // 创建保存内容
    // TODO 线程推文或者多篇内容一起发布
    @Post()
    async create(@Body() ccDto: CreateContentDto) {
        try {
            if (!ccDto.userId) {
                throw new BadRequestException('Content with userId is required')
            }
            return await this.contentService.create(ccDto)
        } catch (error) {
            if (error instanceof BadRequestException ||
                error instanceof NotFoundException) {
                throw error
            }
            throw new InternalServerErrorException('Failed to create content!')
        }
    }

    // 更新发布状态
    @Patch('publish')
    async publish(@Body() publishContentDto: PublishContentDto) {
        try {
            return this.contentService.publish(publishContentDto)
        } catch (error) {
            if (error instanceof BadRequestException ||
                error instanceof NotFoundException) {
                throw error
            }
            throw new InternalServerErrorException('Failed to publish content!')
        }
    }


    @Patch('raw')
    async updateRaw(@Body() urDto: UpdateRawDto) {
        try {
            return this.contentService.updateRaw(urDto)
        } catch (error) {
            if (error instanceof BadRequestException ||
                error instanceof NotFoundException) {
                throw error
            }
            throw new InternalServerErrorException('Failed to update raw!')
        }
    }

    // // 更新互动指标
    // @Patch('metrics')
    // async updateMetrics(@Body() updateMetricsDto: UpdateMetricsDto) {
    //     try {
    //         // 如果没有提供任何更新数据，抛出异常
    //         if (!updateMetricsDto.publicMetrics && !updateMetricsDto.metrics) {
    //             throw new BadRequestException('No metrics data provided for update')
    //         }
    //         return this.contentService.updateMetrics(updateMetricsDto)
    //     } catch (error) {
    //         if (error instanceof BadRequestException ||
    //             error instanceof NotFoundException) {
    //             throw error
    //         }
    //         throw new InternalServerErrorException('Failed to update metrics!')
    //     }
    // }

    @Get()
    async getContents(@Query() gcDto: GetContentsDto) {
        try {
            return this.contentService.getContents(gcDto)
        } catch (error) {
            throw new InternalServerErrorException('Failed to get contents!')
        }
    }
}
