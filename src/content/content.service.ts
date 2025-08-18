// src/database/content.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Content, ContentDocument } from '../schemas/content.schema';
import { CreateContentDto } from '../content/dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';

@Injectable()
export class ContentService {
  constructor(
    @InjectModel(Content.name) private contentModel: Model<Content>,
  ) {}

  async findAll(): Promise<Content[]> {
    return this.contentModel.find().exec();
  }

  async findById(id: string): Promise<Content | null> {
    const content = await this.contentModel.findById(id).exec();
    if (!content) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }
    return content;
  }

  async findByUserId(userId: string): Promise<Content[]> {
    return this.contentModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async findByUserIdAndType(
    userId: string,
    contentType: string,
  ): Promise<Content[]> {
    return this.contentModel
      .find({ userId, contentType })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByParentId(parentId: string): Promise<Content[]> {
    return this.contentModel.find({ parentId }).sort({ createdAt: 1 }).exec();
  }

  async create(createContentDto: CreateContentDto): Promise<Content> {
    const newContent = new this.contentModel(createContentDto);
    return newContent.save();
  }

  async update(
    id: string,
    updateContentDto: UpdateContentDto,
  ): Promise<Content | null> {
    const updatedContent = await this.contentModel
      .findByIdAndUpdate(id, updateContentDto, { new: true })
      .exec();

    if (!updatedContent) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }

    return updatedContent;
  }

  async remove(id: string): Promise<Content | null> {
    const deletedContent = await this.contentModel.findByIdAndDelete(id).exec();
    if (!deletedContent) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }
    return deletedContent;
  }
}
