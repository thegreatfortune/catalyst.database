import { Controller, Get, Post, Body, Param, Query, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { FundsService } from './funds.service'
import { CreateFundsDto } from './dto/create-funds.dto'
import { DepositDto } from './dto/deposit.dto'
import { WithdrawDto } from './dto/withdraw.dto'

@Controller('funds')
export class FundsController {
    constructor(
        private readonly fundsService: FundsService
    ) { }

    @Post('deposit')
    async deposit(@Body() depositDto: DepositDto) {
        try {
            return this.fundsService.deposit(depositDto)
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error
            }
            throw new InternalServerErrorException('Failed to deposit funds')
        }
    }

    @Post('withdraw')
    async withdraw(@Body() withdrawDto: WithdrawDto) {
        try {
            return this.fundsService.withdraw(withdrawDto)
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error
            }
            throw new InternalServerErrorException('Failed to withdraw funds')
        }
    }

    @Get(':userId')
    async getFunds(@Param('userId') userId: string) {
        try {
            return this.fundsService.getFunds(userId)
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error
            }
            throw new InternalServerErrorException('Failed to get funds')
        }
    }
}
