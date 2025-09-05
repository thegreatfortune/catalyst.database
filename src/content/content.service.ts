// src/database/content.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectConnection, InjectModel } from '@nestjs/mongoose'
import mongoose, { ClientSession, Connection, Model, Types } from 'mongoose'
import { Content, ContentAttribute, ContentDocument, ContentStatus, ContentType, Metrics, PublicMetrics } from '../schemas/content.schema'
import { CreateContentDto } from '../content/dto/create-content.dto'
import { PublishContentDto, UpdateRawDto } from './dto/update-content.dto'
import { Logger } from '@nestjs/common'
import { PointService } from '../point/point.service'
import { TransactionType } from 'src/schemas/point.schema'
import { GetContentsDto, SortType } from './dto/get-contents.dto'
import { GetContentsResponseDto } from './dto/get-contents-response.dto'
import { SocialService } from '../social/social.service'
import { SocialAuthService } from '../social-auth/social-auth.service'
import { XUser } from '../schemas/social.schema'

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name)
  constructor(
    @InjectConnection() private connection: Connection,
    @InjectModel(Content.name) private contentModel: Model<Content>,
    private readonly socialService: SocialService,
    private readonly socialAuthService: SocialAuthService,
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
   * 创建内容,平台新推文
   * @param createContentDto 
   * @returns 
   */
  async create(ccDto: CreateContentDto): Promise<Content> {
    try {
      const metrics = new Metrics()
      metrics.anonComments = 0
      const publicMetrics = new PublicMetrics()
      publicMetrics.retweet_count = 0
      publicMetrics.reply_count = 0
      publicMetrics.like_count = 0
      publicMetrics.quote_count = 0
      publicMetrics.bookmark_count = 0
      publicMetrics.impression_count = 0

      const content = new this.contentModel({
        ...ccDto,
        metrics: metrics,
        publicMetrics: publicMetrics,
        status: ContentStatus.DRAFT,
      })
      await content.save()
      return content.toJSON()
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
    const session = await this.connection.startSession()
    session.startTransaction()

    try {

      const query: Record<string, any> = {
        _id: new Types.ObjectId(pcDto.contentId),
        userId: { $ne: null },
      }

      if (pcDto.contributorId) {
        query.contributorId = { $exists: false }
      }

      const operation: Record<string, any> = {
        status: ContentStatus.PUBLISHED,
        rawId: pcDto.rawId,
        publishedTime: new Date()
      }

      if (pcDto.contributorId) {
        operation.contributorId = pcDto.contributorId
      }

      const updatedContent = await this.contentModel
        .findByIdAndUpdate(
          query,
          operation,
          { new: true, session })
        .exec()
      if (!updatedContent) {
        throw new NotFoundException(`Content with ID ${pcDto.contentId} not found`)
      }

      // 如果有contributorId，即匿名模式的content，更新点数，记录点数变化日志
      if (pcDto.contributorId) {
        await this.pointService.upsertPoint({
          userId: pcDto.contributorId,
          transactionType: updatedContent.contentType === ContentType.REPLY ? TransactionType.REPLY : TransactionType.POST,
          reason: 'Publish content',
        }, session)

        await this.socialAuthService.updateSocialAuth({
          userId: pcDto.contributorId,
          provider: updatedContent.provider
        }, session)
      }

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
    const { provider, raw, contributorId } = urDto
    const publicMetrics = new PublicMetrics()
    publicMetrics.retweet_count = raw.data.public_metrics?.retweet_count ?? 0
    publicMetrics.reply_count = raw.data.public_metrics?.reply_count ?? 0
    publicMetrics.like_count = raw.data.public_metrics?.like_count ?? 0
    publicMetrics.quote_count = raw.data.public_metrics?.quote_count ?? 0
    publicMetrics.bookmark_count = raw.data.public_metrics?.bookmark_count ?? 0
    publicMetrics.impression_count = raw.data.public_metrics?.impression_count ?? 0

    try {
      // 更新推文publicMetrics以及raw内容
      let updatedContent = await this.contentModel
        .findByIdAndUpdate(
          { rawId: raw.data.id },
          {
            $set: {
              publicMetrics,
              raw
            },
            $inc: {
              'metrics.anonComments': 1
            }
          },
          { new: true, session })
        .exec()
      if (!updatedContent) {
        const ccDto = new CreateContentDto()
        ccDto.provider = provider
        ccDto.contentType = ContentType.POST
        ccDto.contentAttributes = [ContentAttribute.TEXT]
        ccDto.originalContent = raw.data.text
        const metrics = new Metrics()
        metrics.anonComments = 1
        try {
          updatedContent = new this.contentModel({
            ...ccDto,
            metrics,
            publicMetrics,
            rawId: raw.data.id,
            raw: raw
          })
          await updatedContent.save({ session })
        } catch (error) {
          throw new Error(`Failed to create content from raw tweet: ${error.message}`)
        }
      }

      // 更新推文相关的 socialUsers
      const socialUsers = (raw.includes?.users ?? []) as XUser[]
      await this.socialService.updateSocials({ provider, socialUsers }, session)

      // 更新点数，记录点数变化日志
      await this.pointService.upsertPoint({
        userId: contributorId,
        transactionType: TransactionType.GET,
        reason: 'Get and update raw content',
      }, session)

      await this.socialAuthService.updateSocialAuth({
        userId: contributorId,
        provider: updatedContent.provider
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


  // /**
  //  * 更新互动指标
  //  * @param umDto 
  //  * @returns
  //  */
  // async updateMetrics(umDto: UpdateMetricsDto): Promise<Content> {
  //   const { contentId, publicMetrics, metrics } = umDto
  //   const session = await this.connection.startSession()
  //   session.startTransaction()
  //   try {
  //     // 构建原子操作对象
  //     const updateOperations: any = {}

  //     // 处理publicMetrics - 全量替换
  //     if (publicMetrics) {
  //       updateOperations.$set = {
  //         'publicMetrics': {
  //           ...publicMetrics,
  //           lastUpdated: new Date()
  //         }
  //       }
  //     }

  //     // 处理metrics - 增量更新
  //     if (metrics) {
  //       // 使用$inc操作符进行增量更新
  //       updateOperations.$inc = {
  //         'metrics.anonComments': metrics.changedAnonComments
  //       }
  //     }

  //     // 执行更新
  //     const updatedContent = await this.contentModel
  //       .findByIdAndUpdate(
  //         contentId,
  //         updateOperations,
  //         { new: true, session }
  //       )
  //       .exec()

  //     if (!updatedContent) {
  //       throw new NotFoundException(`Content with ID ${contentId} not found`)
  //     }

  //     // 更新点数，记录点数变化日志
  //     await this.pointService.upsertPoint({
  //       userId: updatedContent.miningUserId,
  //       transactionType: TransactionType.POC,
  //       reason: 'Update content metrics',
  //     }, session)

  //     await session.commitTransaction()

  //     return updatedContent.toJSON()
  //   } catch (error) {
  //     await session.abortTransaction()
  //     this.logger.error(`Failed to update metrics for content with ID ${contentId}: ${error.message}`)
  //     throw error
  //   } finally {
  //     session.endSession()
  //   }
  // }

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
        case SortType.retweetsCount:
          sortField = 'publicMetrics.retweet_count'
          break
        case SortType.replyCount:
          sortField = 'publicMetrics.reply_count'
          break
        case SortType.likeCount:
          sortField = 'publicMetrics.like_count'
          break
        case SortType.quoteCount:
          sortField = 'publicMetrics.quote_count'
          break
        case SortType.bookmarkCount:
          sortField = 'publicMetrics.bookmark_count'
          break
        case SortType.impressionCount:
          sortField = 'publicMetrics.impression_count'
          break
        case SortType.anonComments:
          sortField = 'metrics.anonComments'
          break
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
