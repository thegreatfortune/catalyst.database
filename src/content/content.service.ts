// src/database/content.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectConnection, InjectModel } from '@nestjs/mongoose'
import mongoose, { ClientSession, Connection, Model, Types } from 'mongoose'
import { Content, ContentAttribute, ContentDocument, ContentStatus, ContentType, Metrics, PublicMetrics } from '../schemas/content.schema'
import { CreateContentDto } from '../content/dto/create-content.dto'
import { PublishContentDto, UpdateRawDto } from './dto/update-content.dto'
import { Logger } from '@nestjs/common'
import { CreditService } from '../credit/credit.service'
import { RelatedEntityType, TransactionType } from 'src/schemas/credit.schema'
import { GetContentsDto, GetMyContentsDto, SortType } from './dto/get-contents.dto'
import { GetContentsResponseDto, MyContentItem } from './dto/get-contents-response.dto'
import { SocialService } from '../social/social.service'
import { SocialAuthService } from '../social-auth/social-auth.service'
import { XUser } from '../schemas/social.schema'
import { CreditTransaction } from 'src/schemas/credit.schema'
import { SocialProvider } from 'src/schemas/user.schema'

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name)
  constructor(
    @InjectConnection() private connection: Connection,
    @InjectModel(Content.name) private contentModel: Model<Content>,
    @InjectModel('CreditTransaction') private creditTransactionModel: Model<CreditTransaction>,
    @InjectModel('Social') private socialModel: Model<any>,
    private readonly socialService: SocialService,
    private readonly socialAuthService: SocialAuthService,
    private readonly creditService: CreditService,
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
   * 创建内容,平台新推文,draft状态
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
    const { contentId, contributorId, rawId, isReply, expiryTime } = pcDto

    try {

      const query: Record<string, any> = {
        _id: new Types.ObjectId(contentId),
        userId: { $ne: null },
      }

      if (contributorId) {
        query.contributorId = { $exists: false }
      }

      const operation: Record<string, any> = {
        status: ContentStatus.PUBLISHED,
        rawId: rawId,
        publishedTime: new Date()
      }

      if (contributorId) {
        operation.contributorId = contributorId
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

      // 如果 Content 的 userId 不为空，则需要处理积分扣减或者更新 free post
      if (updatedContent.userId) {
        // 如果是发布新推，且不存在expiryTime
        if (!isReply && !expiryTime) {
          await this.creditService.update({
            userId: updatedContent.userId,
            transactionType: TransactionType.POST,
            reason: 'Publish content',
            relatedEntities: [
              {
                type: RelatedEntityType.CONTENT,
                relatedId: updatedContent._id.toString()
              }
            ]
          }, session)
        }
        // 如果是回复推文
        if (isReply) {
          if (expiryTime instanceof Date) {
            await this.creditService.updateFreePosts({
              userId: updatedContent.userId,
              expiryTime,
            }, session)
          } else {
            await this.creditService.update({
              userId: updatedContent.userId,
              transactionType: TransactionType.REPLY,
              reason: 'Reply content',
              relatedEntities: [
                {
                  type: RelatedEntityType.CONTENT,
                  relatedId: updatedContent._id.toString()
                }
              ]
            }, session)
          }
        }

        // 如果 Content contributorId 也不为空，即匿名模式的content，更新点数，记录点数变化日志
        if (contributorId) {
          await this.creditService.update({
            userId: contributorId,
            transactionType: isReply ? TransactionType.CONTRIBUTE_REPLY : TransactionType.CONTRIBUTE_POST,
            reason: isReply ? 'Contribute reply' : 'Contribute post',
            relatedEntities: [
              {
                type: RelatedEntityType.CONTENT,
                relatedId: updatedContent._id.toString()
              }
            ]
          }, session)

          await this.socialAuthService.updateSocialAuth({
            userId: contributorId,
            provider: updatedContent.provider
          }, session)
        }
      }

      await session.commitTransaction()

      return updatedContent.toJSON()
    } catch (error) {
      await session.abortTransaction()
      this.logger.error(`Failed to update publish status: ${error.message}`)
      throw error
    } finally {
      await session.endSession()
    }
  }


  /**
   * 更新raw内容
   * @param urDto UpdateRawDto
   * @returns Content
   */
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
        .findOneAndUpdate(
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
            status: ContentStatus.RAW,
            metrics,
            publicMetrics,
            rawId: raw.data.id,
            raw: raw,
            createdAt: raw.data.created_at ? new Date(raw.data.created_at) : new Date()
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
      await this.creditService.update({
        userId: contributorId,
        transactionType: TransactionType.CONTRIBUTE_GET,
        reason: 'Get and update raw content',
        relatedEntities: [
          {
            type: RelatedEntityType.CONTENT,
            relatedId: updatedContent._id.toString()
          }
        ]
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
      await session.endSession()
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
      const { provider, limit = 10, page = 1, sort = 'desc', sortType = SortType.createdAt } = gcDto
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
        .find({ provider, status: { $in: [ContentStatus.PUBLISHED, ContentStatus.RAW] } })
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec()
      // console.log('contents', contents[0].toJSON())
      // console.log('lean', (await this.contentModel
      //   .find({ provider, status: { $in: [ContentStatus.PUBLISHED, ContentStatus.RAW] } })
      //   .sort(sortOptions)
      //   .skip(skip)
      //   .limit(limit)
      //   .lean()
      //   .exec())[0])

      // 计算总页数
      const totalPages = Math.ceil(total / limit)

      // 构建分页响应
      const response: GetContentsResponseDto = {
        items: contents.map(content => content.toJSON()) as Content[],
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }

      // console.log('response', response)

      return response
    } catch (error) {
      this.logger.error(`Failed to get contents: ${error.message}`)
      throw error
    }
  }

  async getMyContents(gcDto: GetMyContentsDto) {
    try {
      const { userId, page, limit, sort, sortType } = gcDto
      const skip = (page - 1) * limit
      const sortOrder = sort === 'asc' ? 1 : -1

      // 1. 获取用户的内容
      const contents = await this.contentModel
        .find({ userId })
        .sort({ [sortType]: sortOrder, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec()

      // 2. 获取内容总数
      const total = await this.contentModel.countDocuments({ userId })

      // 3. 获取关联的社交账号信息 (目前只处理X平台)
      const socialAccounts = await this.socialModel
        .find({
          userId,
          provider: SocialProvider.X
        })
        .lean()
        .exec()

      // 创建社交账号映射表 (contributorId -> username)
      const socialMap = new Map()
      socialAccounts.forEach(account => {
        if (account.details && account.details.username) {
          socialMap.set((account._id as Types.ObjectId).toString(), account.details.username)
        }
      })

      // 4. 获取关联的积分交易记录
      const contentIds = contents.map(content => content._id)
      const creditTransactions = await this.creditTransactionModel
        .find({
          userId,
          'relatedEntities.type': RelatedEntityType.CONTENT,
          'relatedEntities.relatedId': { $in: contentIds }
        })
        .lean()
        .exec()

      // 创建积分交易映射表 (contentId -> creditChange)
      const creditMap = new Map()
      creditTransactions.forEach(transaction => {
        if (transaction.relatedEntities && transaction.relatedEntities.length > 0) {
          transaction.relatedEntities.forEach(entity => {
            if (entity.type === RelatedEntityType.CONTENT) {
              const contentId = entity.relatedId.toString()
              creditMap.set(contentId, transaction.change)
            }
          })
        }
      })

      // 5. 组装结果
      const enrichedContents = contents.map(content => {
        const contributorId = content.contributorId ? content.contributorId.toString() : null

        // 添加社交账号用户名
        const contributorUsername = contributorId ? socialMap.get(contributorId) || null : null

        // 添加积分变化
        const creditChange = creditMap.get(content._id.toString()) || 0


        return {
          id: content.id,
          provider: content.provider,
          originalContent: content.originalContent,
          aiGeneratedContent: content.aiGeneratedContent,
          contentType: content.contentType,
          metrics: content.metrics,
          publicMetrics: content.publicMetrics,
          rawId: content.rawId,
          createdAt: content.get('createdAt') ? content.get('createdAt').toISOString() : undefined,
          updatedAt: content.get('updatedAt') ? content.get('updatedAt').toISOString() : undefined,
          lastEditedTime: content.lastEditedTime ? content.lastEditedTime.toISOString() : undefined,
          publishedTime: content.publishedTime ? content.publishedTime.toISOString() : undefined,
          status: content.status,
          contributorUsername,
          creditChange,
        } as MyContentItem
      })

      // 6. 构建分页响应
      const totalPages = Math.ceil(total / limit)
      const hasNextPage = page < totalPages
      const hasPreviousPage = page > 1

      return {
        items: enrichedContents as MyContentItem[],
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPreviousPage
      }
    } catch (error) {
      this.logger.error(`Failed to get my contents: ${error.message}`)
      throw error
    }
  }
}
