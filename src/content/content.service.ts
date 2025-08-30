// src/database/content.service.ts
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectConnection, InjectModel } from '@nestjs/mongoose'
import mongoose, { Connection, Model } from 'mongoose'
import { Content, ContentDocument, ContentStatus, Metrics } from '../schemas/content.schema'
import { CreateContentDto } from '../content/dto/create-content.dto'
import { PublishContentDto, UpdateMetricsDto } from './dto/update-content.dto'
import { Logger } from '@nestjs/common'
import { User } from '../schemas/user.schema'

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name)
  constructor(
    @InjectModel(Content.name) private contentModel: Model<Content>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectConnection() private connection: Connection,
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
  async create(createContentDto: CreateContentDto): Promise<Content> {
    try {
      const contentDoc = new this.contentModel({
        ...createContentDto,
        contentLevel: 0,
        metrics: {
          likes: 0,
          shares: 0,
          comments: 0,
          views: 0,
          saves: 0,
          engagement: 0,
          lastUpdated: new Date()
        },
        status: ContentStatus.DRAFT,
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
   * @param publishContentDto 
   * @returns
   */
  async publish(publishContentDto: PublishContentDto): Promise<Content> {
    const session = await this.connection.startSession()
    session.startTransaction()

    try {
      const updatedContent = await this.contentModel
        .findByIdAndUpdate(publishContentDto.contentId,
          {
            status: ContentStatus.PUBLISHED,
            providerContentId: publishContentDto.providerContentId,
            publishedTime: new Date()
          },
          { new: true, session })
        .exec()
      if (!updatedContent) {
        throw new NotFoundException(`Content with ID ${publishContentDto.contentId} not found`)
      }

      const updatedUser = await this.userModel
        .findOneAndUpdate(
          {
            _id: updatedContent.miningUserId,
            'socialAccountMiningStates.provider': updatedContent.provider
          },
          {
            $inc: {
              'socialAccountMiningStates.$.points': 1,
              'socialAccountMiningStates.$.count': 1
            }
          },
          { new: true, session }
        )
        .exec()

      if (!updatedUser) {
        throw new NotFoundException(`User with ID ${updatedContent.miningUserId} not found`)
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

  /**
   * 更新互动指标
   * @param updateMetricsDto 
   * @returns
   */
  async updateMetrics(updateMetricsDto: UpdateMetricsDto): Promise<Content> {
    try {
      const updatedContent = await this.contentModel
        .findByIdAndUpdate(
          updateMetricsDto.contentId,
          { metrics: { ...updateMetricsDto.metrics, lastUpdated: new Date() } },
          { new: true }
        )
        .exec()

      if (!updatedContent) {
        throw new NotFoundException(`Content with ID ${updateMetricsDto.contentId} not found`)
      }
      return updatedContent
    } catch (error) {
      this.logger.error(`Failed to update metrics for content with ID ${updateMetricsDto.contentId}: ${error.message}`)
      throw error
    }
  }

  async remove(id: string): Promise<Content | null> {
    const deletedContent = await this.contentModel.findByIdAndDelete(id).exec()
    if (!deletedContent) {
      throw new NotFoundException(`Content with ID ${id} not found`)
    }
    return deletedContent
  }
}
