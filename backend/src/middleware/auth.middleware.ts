import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../config/auth";
import { Request, Response, NextFunction } from "express";

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    
    if (!session) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    
    // Attach user to request
    (req as any).user = session.user;
    next();
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
