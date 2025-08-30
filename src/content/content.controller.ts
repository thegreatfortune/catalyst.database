import { BadRequestException, Body, Controller, InternalServerErrorException, NotFoundException, Patch, Post } from '@nestjs/common'
import { ContentService } from './content.service'
import { CreateContentDto } from './dto/create-content.dto'
import { PublishContentDto, UpdateMetricsDto } from './dto/update-content.dto'

@Controller('content')
export class ContentController {
    constructor(
        private readonly contentService: ContentService,
    ) { }

    // 创建保存内容
    // TODO 线程推文或者多篇内容一起发布
    @Post()
    async create(@Body() createContentDto: CreateContentDto) {
        try {
            return await this.contentService.create(createContentDto)
        } catch (error) {
            if (error instanceof BadRequestException ||
                error instanceof NotFoundException) {
                throw error
            }
            throw new InternalServerErrorException('Failed to create content!')
        }
    }

    // 更新发布状态
    // TODO 多篇内容的更新，以及points计算
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

    // 更新互动指标
    @Patch('metrics')
    async updateMetrics(@Body() updateMetricsDto: UpdateMetricsDto) {
        try {
            return this.contentService.updateMetrics(updateMetricsDto)
        } catch (error) {
            if (error instanceof BadRequestException ||
                error instanceof NotFoundException) {
                throw error
            }
            throw new InternalServerErrorException('Failed to update metrics!')
        }
    }
}
