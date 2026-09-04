import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ message: "المسار غير موجود" });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ message: err.message });
  }
  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    return res.status(400).json({ message: firstIssue?.message ?? "بيانات غير صالحة", issues: err.issues });
  }
  console.error(err);
  return res.status(500).json({ message: "حدث خطأ غير متوقع في الخادم" });
}
