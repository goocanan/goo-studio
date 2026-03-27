import { Request, Response, NextFunction } from "express";

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  // Bypassing auth: assigning a default guest user id to every request
  (req as any).user = { id: 'default-user' };
  next();
};
