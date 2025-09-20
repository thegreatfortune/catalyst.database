import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'
import { Type } from 'class-transformer'

export class TransferDto {
    @IsNotEmpty()
    @IsString()
    fromUserId: string

    @IsNotEmpty()
    @IsString()
    toUserId: string

    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    amount: number

    @IsOptional()
    @IsString()
    reason?: string
}
