// src/database/content.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectConnection, InjectModel } from '@nestjs/mongoose'
import mongoose, { ClientSession, Connection, Model } from 'mongoose'
import { Content, ContentDocument, ContentStatus, Metrics, PublicMetrics } from '../schemas/content.schema'
import { CreateContentDto } from '../content/dto/create-content.dto'
import { PublishContentDto, UpdateMetricsDto } from './dto/update-content.dto'
import { Logger } from '@nestjs/common'
import { PointService } from '../point/point.service'
import { TransactionType } from 'src/schemas/point.schema'
import { GetContentsDto, SortType } from './dto/get-contents.dto'
import { GetContentsResponseDto } from './dto/get-contents-response.dto'

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name)
  constructor(
    @InjectConnection() private connection: Connection,
    @InjectModel(Content.name) private contentModel: Model<Content>,
    private readonly pointService: PointService
  ) { }

  async findAll(): Promise<Content[]> {
    return this.contentModel.find().exec()
  }

  /**
   * 根据ID查找内容
   * @param id 
   * @returns 
   */
  async findById(id: string): Promise<Content | null> {
    try {
      const content = await this.contentModel.findById(id).exec()
      if (!content) {
        throw new NotFoundException(`Content with ID ${id} not found`)
      }
      return content
    } catch (error) {
      this.logger.error(`Failed to find content by ID: ${error.message}`)
      throw error
    }
  }

  /**
   * 根据用户ID查找内容
   * @param userId 
   * @returns 
   */
  async findByUserId(userId: string): Promise<Content[]> {
    try {
      return this.contentModel.find({ userId }).sort({ createdAt: -1 }).exec()
    } catch (error) {
      this.logger.error(`Failed to find content by user ID: ${error.message}`)
      throw error
    }
  }

  /**
   * 根据用户ID和内容类型查找内容
   * @param userId 
   * @param contentType 
   * @returns 
   */
  async findByUserIdAndType(
    userId: string,
    contentType: string,
  ): Promise<Content[]> {
    try {
      return this.contentModel
        .find({ userId, contentType })
        .sort({ createdAt: -1 })
        .exec()
    } catch (error) {
      this.logger.error(`Failed to find content by user ID and type: ${error.message}`)
      throw error
    }
  }

  /**
   * 根据父ID查找内容
   * @param parentId 
   * @returns 
   */
  async findByParentId(parentId: string): Promise<Content[]> {
    try {
      return this.contentModel.find({ parentId }).sort({ createdAt: 1 }).exec()
    } catch (error) {
      this.logger.error(`Failed to find content by parent ID: ${error.message}`)
      throw error
    }
  }

  /**
   * 创建内容
   * @param createContentDto 
   * @returns 
   */
  async create(ccDto: CreateContentDto): Promise<Content> {
    const { publicMetrics: nativePublicMetrics, providerContentId, ...rest } = ccDto
    try {

      // 检查是否为原始社媒的内容，如果存在增不能重新保存
      if (ccDto.isNative && providerContentId) {
        const existContent = await this.contentModel.findOne({
          providerContentId: providerContentId,
          isNative: true
        }).exec()
        if (existContent) {
          throw new BadRequestException('Content with providerContentId already exists')
        }
      }

      const metrics = new Metrics()
      metrics.anonComments = 0

      const publicMetrics = new PublicMetrics()
      if (ccDto.isNative && nativePublicMetrics) {
        publicMetrics.likes = nativePublicMetrics.likes
        publicMetrics.shares = nativePublicMetrics.shares
        publicMetrics.comments = nativePublicMetrics.comments
        publicMetrics.views = nativePublicMetrics.views
        publicMetrics.saves = nativePublicMetrics.saves
        publicMetrics.lastUpdated = new Date()
      } else {
        publicMetrics.likes = 0
        publicMetrics.shares = 0
        publicMetrics.comments = 0
        publicMetrics.views = 0
        publicMetrics.saves = 0
        publicMetrics.lastUpdated = new Date()
      }

      const contentDoc = new this.contentModel({
        ...rest,
        contentLevel: 0,
        metrics: metrics,
        publicMetrics: publicMetrics,
        status: ccDto.isNative ? ContentStatus.PUBLISHED : ContentStatus.DRAFT,
        lastEditedTime: new Date()
      })
      await contentDoc.save()
      return contentDoc.toJSON()
    } catch (error) {
      this.logger.error(`Failed to create content: ${error.message}`)
      throw error
    }
  }

  /**
   * 更新发布状态，及用户socialAccountMiningStates.points
   * @param pcDto 
   * @returns
   */
  async publish(pcDto: PublishContentDto): Promise<Content> {
    const session = await this.connection.startSession()
    session.startTransaction()

    try {
      const updatedContent = await this.contentModel
        .findByIdAndUpdate(pcDto.contentId,
          {
            status: ContentStatus.PUBLISHED,
            providerContentId: pcDto.providerContentId,
            publishedTime: new Date()
          },
          { new: true, session })
        .exec()
      if (!updatedContent) {
        throw new NotFoundException(`Content with ID ${pcDto.contentId} not found`)
      }

      // 更新点数，记录点数变化日志
      await this.pointService.upsertPoint({
        userId: updatedContent.miningUserId,
        transactionType: TransactionType.POC,
        reason: 'Publish content',
      }, session)

      await session.commitTransaction()

      return updatedContent.toJSON()
    } catch (error) {
      await session.abortTransaction()
      this.logger.error(`Failed to update publish status: ${error.message}`)
      throw error
    } finally {
      session.endSession()
    }
  }

  /**
   * 更新互动指标
   * @param umDto 
   * @returns
   */
  async updateMetrics(umDto: UpdateMetricsDto): Promise<Content> {
    const { contentId, publicMetrics, metrics } = umDto
    const session = await this.connection.startSession()
    session.startTransaction()
    try {
      // 构建原子操作对象
      const updateOperations: any = {}

      // 处理publicMetrics - 全量替换
      if (publicMetrics) {
        updateOperations.$set = {
          'publicMetrics': {
            ...publicMetrics,
            lastUpdated: new Date()
          }
        }
      }

      // 处理metrics - 增量更新
      if (metrics) {
        // 使用$inc操作符进行增量更新
        updateOperations.$inc = {
          'metrics.anonComments': metrics.changedAnonComments
        }
      }

      // 执行更新
      const updatedContent = await this.contentModel
        .findByIdAndUpdate(
          contentId,
          updateOperations,
          { new: true, session }
        )
        .exec()

      if (!updatedContent) {
        throw new NotFoundException(`Content with ID ${contentId} not found`)
      }

      // 更新点数，记录点数变化日志
      await this.pointService.upsertPoint({
        userId: updatedContent.miningUserId,
        transactionType: TransactionType.POC,
        reason: 'Update content metrics',
      }, session)

      await session.commitTransaction()

      return updatedContent.toJSON()
    } catch (error) {
      await session.abortTransaction()
      this.logger.error(`Failed to update metrics for content with ID ${contentId}: ${error.message}`)
      throw error
    } finally {
      session.endSession()
    }
  }

  async remove(id: string): Promise<Content | null> {
    const deletedContent = await this.contentModel.findByIdAndDelete(id).exec()
    if (!deletedContent) {
      throw new NotFoundException(`Content with ID ${id} not found`)
    }
    return deletedContent
  }

  /**
   * 获取内容列表，支持分页和排序
   * @param gcDto 
   * @returns 
   */
  async getContents(gcDto: GetContentsDto) {
    try {
      const { limit = 10, page = 1, sort = 'desc', sortType = SortType.createdAt } = gcDto
      const skip = (page - 1) * limit

      // 构建排序条件
      const sortOptions: Record<string, 1 | -1> = {}
      let sortField: string

      // 根据sortType确定排序字段
      switch (sortType) {
        case SortType.views:
          sortField = 'metrics.views'
          break
        case SortType.comments:
          sortField = 'metrics.comments'
          break
        case SortType.likes:
          sortField = 'metrics.likes'
          break
        case SortType.createdAt:
        default:
          sortField = 'createdAt'
          break
      }

      sortOptions[sortField] = sort === 'asc' ? 1 : -1

      // 查询总数
      const total = await this.contentModel.countDocuments().exec()

      // 查询当前页数据
      const contents = await this.contentModel
        .find()
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec()

      // 计算总页数
      const totalPages = Math.ceil(total / limit)

      // 构建分页响应
      const response: GetContentsResponseDto = {
        items: contents.map(content => content.toJSON()),
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }

      return response
    } catch (error) {
      this.logger.error(`Failed to get contents: ${error.message}`)
      throw error
    }
  }
}
