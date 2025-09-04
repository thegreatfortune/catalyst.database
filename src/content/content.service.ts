// src/database/content.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectConnection, InjectModel } from '@nestjs/mongoose'
import mongoose, { ClientSession, Connection, Model } from 'mongoose'
import { Content, ContentDocument, ContentStatus, ContentType, Metrics, PublicMetrics } from '../schemas/content.schema'
import { CreateContentDto } from '../content/dto/create-content.dto'
import { PublishContentDto, UpdateRawDto } from './dto/update-content.dto'
import { Logger } from '@nestjs/common'
import { PointService } from '../point/point.service'
import { TransactionType } from 'src/schemas/point.schema'
import { GetContentsDto, SortType } from './dto/get-contents.dto'
import { GetContentsResponseDto } from './dto/get-contents-response.dto'
import { SocialService } from 'src/social/social.service'
import { XUser } from 'src/schemas/social.schema'

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name)
  constructor(
    @InjectConnection() private connection: Connection,
    @InjectModel(Content.name) private contentModel: Model<Content>,
    private readonly socialService: SocialService,
    private readonly pointService: PointService,
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
    const { rawId, ...rest } = ccDto
    try {

      // 检查是否为原始社媒的内容，如果存在增不能重新保存
      if (rawId) {
        const existContent = await this.contentModel.findOne({ rawId }).exec()
        if (existContent) {
          throw new BadRequestException('Content with rawId already exists')
        }
      }

      const metrics = new Metrics()
      metrics.anonComments = 0

      const contentDoc = new this.contentModel({
        ...rest,
        metrics: metrics,
        status: rawId ? ContentStatus.RAW : ContentStatus.DRAFT,
      })
      await contentDoc.save()
      return contentDoc.toJSON()
    } catch (error) {
      this.logger.error(`Failed to create content: ${error.message}`)
      throw error
    }
  }

  /**
   * 更新发布状态，及用户 points，只针对通过平台匿名发布的content
   * @param pcDto 
   * @returns
   */
  async publish(pcDto: PublishContentDto): Promise<Content> {

    const incrementValue = pcDto.contentType === ContentType.COMMENT ? 0 : 1

    const session = await this.connection.startSession()
    session.startTransaction()

    try {
      const updatedContent = await this.contentModel
        .findByIdAndUpdate({
          _id: pcDto.contentId,
          userId: { $ne: null },
          contributorId: { $ne: null },
        },
          {
            $set: {
              status: ContentStatus.PUBLISHED,
              rawId: pcDto.rawId,
              publishedTime: new Date()
            },
            $inc: {
              'metrics.anonComments': incrementValue
            },
          },
          { new: true, session })
        .exec()
      if (!updatedContent) {
        throw new NotFoundException(`Content with ID ${pcDto.contentId} not found`)
      }

      // 更新点数，记录点数变化日志
      await this.pointService.upsertPoint({
        userId: updatedContent.raw.userId,
        transactionType: updatedContent.contentType === ContentType.COMMENT ? TransactionType.COMMENT : TransactionType.POST,
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


  async updateRaw(urDto: UpdateRawDto): Promise<Content> {
    const session = await this.connection.startSession()
    session.startTransaction()
    const { contentId, provider, raw, contributorId } = urDto
    const publicMetrics = new PublicMetrics()
    publicMetrics.retweet_count = raw.data.public_metrics?.retweet_count ?? 0
    publicMetrics.reply_count = raw.data.public_metrics?.reply_count ?? 0
    publicMetrics.like_count = raw.data.public_metrics?.like_count ?? 0
    publicMetrics.quote_count = raw.data.public_metrics?.quote_count ?? 0
    publicMetrics.bookmark_count = raw.data.public_metrics?.bookmark_count ?? 0
    publicMetrics.impression_count = raw.data.public_metrics?.impression_count ?? 0

    try {
      // 更新推文publicMetrics以及raw内容
      const updatedContent = await this.contentModel
        .findByIdAndUpdate(
          contentId,
          {
            publicMetrics,
            raw
          },
          { new: true, session })
        .exec()
      if (!updatedContent) {
        throw new NotFoundException(`Content with ID ${contentId} not found`)
      }

      // 更新推文相关的socialUsers
      const socialUsers = (raw.includes?.users ?? []) as XUser[]
      await this.socialService.updateSocials({ provider, socialUsers })

      // 更新点数，记录点数变化日志
      await this.pointService.upsertPoint({
        userId: contributorId,
        transactionType: TransactionType.GET,
        reason: 'Get and update raw content',
      }, session)

      await session.commitTransaction()
      return updatedContent.toJSON()
    } catch (error) {
      await session.abortTransaction()
      this.logger.error(`Failed to update raw: ${error.message}`)
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
