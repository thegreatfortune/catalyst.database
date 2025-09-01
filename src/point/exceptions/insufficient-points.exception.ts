import { HttpException, HttpStatus } from '@nestjs/common'

export class InsufficientPointsException extends HttpException {
    constructor(required: number, available: number) {
        super(
            {
                statusCode: HttpStatus.BAD_REQUEST,
                message: `Insufficient points: required ${required}, available ${available}`,
                error: 'Bad Request',
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}
