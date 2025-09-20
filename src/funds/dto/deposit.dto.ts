import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'
import { Type } from 'class-transformer'

export class DepositDto {
    @IsNotEmpty()
    @IsString()
    userId: string

    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    amount: number

    @IsNotEmpty()
    @IsString()
    transactionHash: string
}
