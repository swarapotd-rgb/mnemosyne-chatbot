export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code?: string;
        details?: any;
    };
}

export const createSuccessResponse = <T>(data: T): ApiResponse<T> => ({
    success: true,
    data
});

export const createErrorResponse = (message: string, code?: string, details?: any): ApiResponse<never> => ({
    success: false,
    error: {
        message,
        code,
        details
    }
});