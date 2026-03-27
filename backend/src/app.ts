import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./config/auth";
import { projectRouter } from "./routes/project.routes";
import { spoolRouter } from "./routes/spool.routes";
import { batchRouter } from "./routes/batch.routes";
import { userRouter } from "./routes/user.routes";
import { toNodeHandler } from "better-auth/node";

dotenv.config();

const app = express();

app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    
    if (!session) {
      console.log('UNAUTHORIZED_ACCESS:', req.path);
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    
    (req as any).user = session.user;
    next();
  } catch (error) {
    console.error('MIDDLEWARE_AUTH_ERROR:', error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const authHandler = toNodeHandler(auth);

app.all(/\/api\/auth\/.*/, async (req, res, next) => {
  try {
    return authHandler(req, res);
  } catch (err: any) {
    console.error('CRITICAL_AUTH_ERROR_FULL:', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method
    });
    next(err);
  }
});

app.use("/api/projects", projectRouter);
app.use("/api/spools", spoolRouter);
app.use("/api/batches", batchRouter);
app.use("/api/user", userRouter);

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('SERVER_ERROR:', err);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

export default app;
