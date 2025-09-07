import { HttpException, HttpStatus } from '@nestjs/common'

export class InsufficientCreditsException extends HttpException {
    constructor(required: number, available: number) {
        super(
            {
                statusCode: HttpStatus.BAD_REQUEST,
                message: `Insufficient credits: required ${required}, available ${available}`,
                error: 'Bad Request',
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}
