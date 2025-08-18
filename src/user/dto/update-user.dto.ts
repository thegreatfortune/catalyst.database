// src/database/dto/update-user.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsString()
  @IsOptional()
  nonce?: string;

  @IsString()
  @IsOptional()
  lastSignature?: string;

  @IsOptional()
  lastSignedAt?: Date;
}
