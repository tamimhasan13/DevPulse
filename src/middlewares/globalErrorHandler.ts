import type { NextFunction, Request, Response } from "express";

const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const error = err as { statusCode?: number; message?: string };

  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";
  res.status(statusCode).json({
    success: false,
    message
  });
};

export default globalErrorHandler;
