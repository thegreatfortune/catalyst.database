// src/database/content.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectConnection, InjectModel } from '@nestjs/mongoose'
import mongoose, { ClientSession, Connection, Model, Types } from 'mongoose'
import { Content, ContentAttribute, ContentDocument, ContentStatus, ContentType, Metrics, PublicMetrics } from '../schemas/content.schema'
import { CreateContentDto } from '../content/dto/create-content.dto'
import { PublishContentDto, UpdateRawDto } from './dto/update-content.dto'
import { Logger } from '@nestjs/common'
import { CreditService } from '../credit/credit.service'
import { RelatedEntityType, CreditTransactionType } from 'src/schemas/credit.schema'
import { GetContentsDto, GetMyContentsDto, SortType } from './dto/get-contents.dto'
import { ContentItem, GetContentsResponseDto, MyContentItem } from './dto/get-contents-response.dto'
import { SocialService } from '../social/social.service'
import { SocialAuthService } from '../social-auth/social-auth.service'
import { XUser } from '../schemas/social.schema'
import { CreditTransaction } from '../schemas/credit.schema'
import { SocialProvider } from '../schemas/user.schema'
import { UserV2 } from 'twitter-api-v2'
import { FundsService } from '../funds/funds.service'
import { FundsTransactionType } from 'src/schemas/funds.schema'
import { ConfigService } from '../config/config.service'
import { OperationType } from '../schemas/transaction.schema'
import { TransactionService } from '../transaction/transaction.service'


@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name)
  constructor(
    @InjectConnection() private connection: Connection,
    @InjectModel(Content.name) private contentModel: Model<Content>,
    @InjectModel('CreditTransaction') private creditTransactionModel: Model<CreditTransaction>,
    @InjectModel('Social') private socialModel: Model<any>,
    private readonly configService: ConfigService,
    private readonly socialService: SocialService,
    private readonly socialAuthService: SocialAuthService,
    private readonly fundsService: FundsService,
    private readonly creditService: CreditService,
    private readonly transactionService: TransactionService
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
          const userId = updatedContent.userId
          const operationType = OperationType.POST
          // 更新credit积分
          const updatedCredit = await this.creditService.update({ userId, operationType, }, session)
          // 更新资金账户
          const updatedFunds = await this.fundsService.update({ userId, operationType, }, session)

          await this.transactionService.create({
            userId,
            operationType,
            creditBalanceAfter: updatedCredit.balance,
            fundsBalanceAfter: updatedFunds.balance,
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
            const userId = updatedContent.userId
            const operationType = OperationType.REPLY
            // 更新credit积分
            const updatedCredit = await this.creditService.update({ userId, operationType, }, session)
            // 更新资金账户
            const updatedFunds = await this.fundsService.update({ userId, operationType, }, session)

            await this.transactionService.create({
              userId,
              operationType,
              creditBalanceAfter: updatedCredit.balance,
              fundsBalanceAfter: updatedFunds.balance,
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
          // 更新contributor的credit积分
          const updatedCredit = await this.creditService.update({
            userId: contributorId,
            operationType: isReply ? OperationType.CONTRIBUTE_REPLY : OperationType.CONTRIBUTE_POST,
          }, session)

          // 更新contributor的资金账户
          const updatedFunds = await this.fundsService.update({
            userId: contributorId,
            operationType: isReply ? OperationType.CONTRIBUTE_REPLY : OperationType.CONTRIBUTE_POST,
          }, session)

          await this.transactionService.create({
            userId: contributorId,
            operationType: isReply ? OperationType.CONTRIBUTE_REPLY : OperationType.CONTRIBUTE_POST,
            creditBalanceAfter: updatedCredit.balance,
            fundsBalanceAfter: updatedFunds.balance,
            reason: isReply ? 'Contribute reply' : 'Contribute post',
            relatedEntities: [
              {
                type: RelatedEntityType.CONTENT,
                relatedId: updatedContent._id.toString()
              }
            ]
          }, session)

          // 更新contributor的socialAuth的 lastUsedAt
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
      const updatedCredit = await this.creditService.update({
        userId: contributorId,
        operationType: OperationType.CONTRIBUTE_GET,
      }, session)

      // 更新contributor的资金账户
      const updatedFunds = await this.fundsService.update({
        userId: contributorId,
        operationType: OperationType.CONTRIBUTE_GET,
      }, session)

      await this.transactionService.create({
        userId: contributorId,
        operationType: OperationType.CONTRIBUTE_GET,
        creditBalanceAfter: updatedCredit.balance,
        fundsBalanceAfter: updatedFunds.balance,
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
  async getContents(gcDto: GetContentsDto, userId?: string) {
    try {
      const { provider, limit = 10, page = 1, sort = 'desc', sortType = SortType.createdAt } = gcDto
      const skip = (page - 1) * limit

      const matchCondition: Record<string, any> = {
        provider,
        status: { $in: [ContentStatus.PUBLISHED, ContentStatus.RAW] }
      }
      if (userId) {
        matchCondition.userId = new Types.ObjectId(userId)
      }


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

      // 使用聚合查询获取内容并关联contributor信息
      const aggregateResults = await this.contentModel.aggregate([
        // 匹配条件
        {
          $match: matchCondition
        },
        // 排序
        { $sort: sortOptions },
        // 分页
        { $skip: skip },
        { $limit: limit },
        // 关联social集合，只关联provider为X的记录
        {
          $lookup: {
            from: 'socials', // social集合名称
            let: { contributorId: "$contributorId" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$userId", "$$contributorId"] },
                  provider: SocialProvider.X
                }
              },
              // 只获取需要的字段，减少数据传输
              {
                $project: {
                  "details.id": 1,
                  "details.username": 1,
                  "details.name": 1,
                  "details.profile_image_url": 1,
                  "details.verified": 1
                }
              }
            ],
            as: 'contributorSocial'
          }
        },
        // 处理关联结果
        {
          $addFields: {
            contributor: {
              $cond: {
                if: { $gt: [{ $size: "$contributorSocial" }, 0] },
                then: {
                  // id: { $arrayElemAt: ["$contributorSocial.details.id", 0] },
                  username: { $arrayElemAt: ["$contributorSocial.details.username", 0] },
                  name: { $arrayElemAt: ["$contributorSocial.details.name", 0] },
                  profile_image_url: { $arrayElemAt: ["$contributorSocial.details.profile_image_url", 0] },
                  verified: { $arrayElemAt: ["$contributorSocial.details.verified", 0] },
                  verified_type: { $arrayElemAt: ["$contributorSocial.details.verified_type", 0] }
                },
                else: null
              }
            }
          }
        },
        // 移除不需要的字段
        {
          $project: {
            contributorSocial: 0
          }
        }
      ]).hint(userId ? "userId_1_provider_1_status_1" : "provider_1_status_1").exec()

      // 计算总页数
      const total = await this.contentModel.countDocuments().exec()
      const totalPages = Math.ceil(total / limit)

      console.log('total', total)
      console.log('totalPages', totalPages)
      console.log('aggregateResults', aggregateResults)

      // 构建分页响应
      const response: GetContentsResponseDto = {
        items: aggregateResults.map(content => {
          console.log('content', content)
          const contentItem: ContentItem = {
            id: content._id.toString(),
            provider: content.provider,
            originalContent: content.originalContent,
            aiGeneratedContent: content.aiGeneratedContent,
            contentType: content.contentType,
            metrics: content.metrics,
            publicMetrics: content.publicMetrics,
            rawId: content.rawId,
            createdAt: new Date(content.createdAt).toISOString(),
            updatedAt: new Date(content.updatedAt).toISOString(),
            lastEditedTime: new Date(content.lastEditedTime).toISOString(),
            publishedTime: content.publishedTime ? new Date(content.publishedTime).toISOString() : undefined,
            status: content.status,
            contributor: content.contributor
          }
          if (content.raw) {
            contentItem.raw = {
              data: {
                id: content.raw.data.id,
                author_id: content.raw.data.author_id,
                text: content.raw.data.text,
                attachments: content.raw.data.attachments,
                edit_history_tweet_ids: content.raw.data.edit_history_tweet_ids,
                public_metrics: content.raw.data.public_metrics,
              },
              includes: {
                media: content.raw.includes.media,
                users: content.raw.includes.users.map((user: UserV2) => {
                  return {
                    id: user.id,
                    username: user.username,
                    name: user.name,
                    profile_image_url: user.profile_image_url,
                    verified: user.verified,
                    verified_type: user.verified_type
                  }
                })
              }
            }
          }

          if (content.replyToTweetId) {
            contentItem.replyToTweetId = content.replyToTweetId
          }

          if (content.replyToRawUsername) {
            contentItem.replyToRawUsername = content.replyToRawUsername
          }

          return contentItem
        }),
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
              creditMap.set(contentId, transaction.changeAmount)
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
