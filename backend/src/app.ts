import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    process.env.FRONTEND_URL || "",
  ].filter(Boolean),
  credentials: true,
}));

app.use(express.json());

import { auth } from "./config/auth";
import { projectRouter } from "./routes/project.routes";
import { spoolRouter } from "./routes/spool.routes";
import { batchRouter } from "./routes/batch.routes";
import { userRouter } from "./routes/user.routes";

import { toNodeHandler } from "better-auth/node";

const authHandler = toNodeHandler(auth);
app.all(/\/api\/auth\/.*/, async (req, res, next) => {
  try {
    return authHandler(req as any, res as any);
  } catch (err) {
    console.error('AUTH_ERROR:', err);
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
