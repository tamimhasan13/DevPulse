import type { NextFunction, Request, Response } from "express";

const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {

  res.status(500).json({
    success: false,
    message: err instanceof Error ? err.message : "Internal Server Error",
  });
};

export default globalErrorHandler;
