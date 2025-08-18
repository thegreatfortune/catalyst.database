// src/database/dto/update-content.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateContentDto } from '../../content/dto/create-content.dto';

export class UpdateContentDto extends PartialType(CreateContentDto) {
  // 所有字段都是可选的，因为继承自 PartialType(CreateContentDto)
}
