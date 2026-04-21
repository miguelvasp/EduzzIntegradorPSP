import type { ErrorResponse } from '../dto/ErrorResponse';

export function errorResponse(params: {
  status: number;
  code: string;
  message: string;
  requestId: string;
  timestamp?: string;
}): ErrorResponse {
  return {
    timestamp: params.timestamp ?? new Date().toISOString(),
    status: params.status,
    code: params.code,
    message: params.message,
    requestId: params.requestId,
  };
}
