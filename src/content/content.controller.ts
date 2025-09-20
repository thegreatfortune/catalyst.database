import { BadRequestException, Body, Controller, Get, InternalServerErrorException, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common'
import { ContentService } from './content.service'
import { CreateContentDto } from './dto/create-content.dto'
import { PublishContentDto, UpdateRawDto } from './dto/update-content.dto'
import { GetContentsDto, GetMyContentsDto } from './dto/get-contents.dto'
import { InsufficientCreditsException } from '../credit/exceptions/insufficient-credits.exception'

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
                error instanceof NotFoundException ||
                error instanceof InsufficientCreditsException) {
                throw error
            }
            throw new InternalServerErrorException('Failed to publish content!')
        }
    }

    /**
     * 更新raw内容
     * @param urDto UpdateRawDto 
     * @returns 
     */
    @Patch('raw')
    async updateRaw(@Body() urDto: UpdateRawDto) {
        try {
            return this.contentService.updateRaw(urDto)
        } catch (error) {
            if (error instanceof BadRequestException ||
                error instanceof NotFoundException ||
                error instanceof InsufficientCreditsException) {
                throw error
            }
            throw new InternalServerErrorException('Failed to update raw!')
        }
    }

    /**
     * 获取内容列表
     * @param gcDto GetContentsDto 
     * @returns 
     */
    @Get()
    async getContents(@Query() gcDto: GetContentsDto) {
        try {

            return this.contentService.getContents(gcDto)
        } catch (error) {
            throw new InternalServerErrorException('Failed to get contents!')
        }
    }

    @Get(':userId')
    async getMyContents(@Param('userId') userId: string, @Query() gcDto: GetContentsDto) {
        try {
            console.log(userId, gcDto)
            return this.contentService.getContents(gcDto, userId)
            // return this.contentService.getMyContents({ ...gcDto, userId })
        } catch (error) {
            throw new InternalServerErrorException('Failed to get my contents!')
        }
    }
}
