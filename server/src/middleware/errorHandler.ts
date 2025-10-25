import { Request, Response, NextFunction } from 'express';

export interface CustomError extends Error {
    status?: number;
    code?: string;
}

export const errorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', {
        message: err.message,
        stack: err.stack,
        code: err.code
    });

    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
            code: err.code || 'INTERNAL_ERROR'
        }
    });
};