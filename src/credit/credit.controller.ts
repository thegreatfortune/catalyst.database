import { BadRequestException, Controller, Get, InternalServerErrorException, NotFoundException, Param, Post, Query } from '@nestjs/common'
import { CreditService } from './credit.service'
import { GetCreditTransactionsDto } from './dto/get-credit-transactions.dto'
import { CreditTransaction } from '../schemas/credit.schema'
import { GetCreditTransactionsResponseDto } from './dto/get-credit-transactions-response.dto'


@Controller('credit')
export class CreditController {
    constructor(
        private readonly creditService: CreditService
    ) { }

    @Get(':userId')
    async getCredit(@Param('userId') userId: string) {
        try {
            return this.creditService.findByUserId(userId)
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error
            }
            throw new InternalServerErrorException(`Failed to get credit by user id: ${error.message}`)
        }
    }

    @Get('/transactions')
    async getCreditTransactionsByUserId(@Query() gctDto: GetCreditTransactionsDto) {
        try {
            return this.creditService.getCreditTransactionsByUserId(gctDto)
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error
            }
            throw new InternalServerErrorException(`Failed to get credit transactions by user id: ${error.message}`)
        }
    }
}
