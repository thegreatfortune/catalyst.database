import { BadRequestException, Controller, Get, InternalServerErrorException, NotFoundException, Param, Post, Query } from '@nestjs/common'
import { CreditService } from './credit.service'
import { GetCreditTransactionsDto } from './dto/get-credit-transactions.dto'
import { CreditTransaction } from '../schemas/credit.schema'
import { GetCreditTransactionsResponseDto } from './dto/get-credit-transactions-response.dto'
import { GetCreditDto } from './dto/get-credit.dto'

@Controller('user/credit')
export class CreditController {

    constructor(
        private readonly creditService: CreditService
    ) { }


    @Get()
    async getCredit(@Query() gcDto: GetCreditDto) {
        const { userId } = gcDto
        try {
            return this.creditService.findByUserId(userId)
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error
            }
            throw new InternalServerErrorException(`Failed to get credit by user id: ${error.message}`)
        }
    }

    @Get('transactions')
    async getTransactions(@Query() gctDto: GetCreditTransactionsDto): Promise<GetCreditTransactionsResponseDto> {
        try {
            return this.creditService.findCreditTransactions(gctDto)
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error
            }
            throw new InternalServerErrorException(`Failed to get credit transactions by user id: ${error.message}`)
        }

    }

    @Get('transaction/:id')
    async getCreditTransactionsById(@Param('id') id: string): Promise<CreditTransaction> {
        return this.creditService.findCreditTransactionById(id)
    }
}
