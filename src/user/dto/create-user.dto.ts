// src/database/dto/create-user.dto.ts
import { Type } from 'class-transformer'
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator'

export class WalletInfoDto {
  @IsString()
  @IsOptional()
  ens?: string

  @IsString()
  @IsOptional()
  balance?: string

  @IsOptional()
  tokenBalances?: {
    tokenAddress: string
    symbol: string
    balance: string
    decimals: number
  }[]
}


export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  walletAddress: string

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  chainId: number = 56;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  lastSignedAt: Date
}
