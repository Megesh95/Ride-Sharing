import type { NextFunction, Request, Response } from "express";

type ApiError = {
  statusCode: number;
  message: string;
  details?: unknown;
};

function normalizeError(err: unknown): ApiError {
  if (typeof err === "object" && err !== null) {
    const maybe = err as Partial<ApiError> & { status?: number; statusCode?: number; message?: unknown };
    const statusCode =
      typeof maybe.statusCode === "number"
        ? maybe.statusCode
        : typeof maybe.status === "number"
          ? maybe.status
          : 500;

    const message = typeof maybe.message === "string" ? maybe.message : "Internal Server Error";

    return {
      statusCode,
      message,
      details: maybe,
    };
  }
  return { statusCode: 500, message: "Internal Server Error" };
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const e = normalizeError(err);
  res.status(e.statusCode).json({
    error: {
      message: e.message,
      ...(process.env.NODE_ENV === "development" ? { details: e.details } : null),
    },
  });
}

