import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { FundsTransactionType } from '../../schemas/funds.schema'
import { RelatedEntity } from '../../schemas/credit.schema'

export class UpdateFundsDto {
    @IsNotEmpty()
    @IsString()
    userId: string

    @IsNotEmpty()
    @IsEnum(FundsTransactionType)
    transactionType: FundsTransactionType

    @IsOptional()
    @IsString()
    reason?: string

    @IsOptional()
    balanceAfter?: number

    @IsOptional()
    relatedEntities?: RelatedEntity[]

    @IsOptional()
    @IsString()
    transactionHash?: string
}
