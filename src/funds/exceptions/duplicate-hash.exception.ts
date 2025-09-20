import { BadRequestException } from '@nestjs/common'

export class DuplicateTransactionHashException extends BadRequestException {
    constructor(txHash: string) {
        super(`Duplicate transaction hash: ${txHash}`)
    }
}
