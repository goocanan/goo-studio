import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));

app.use(express.json());

import { authRouter } from "./routes/auth.routes";
import { projectRouter } from "./routes/project.routes";
import { spoolRouter } from "./routes/spool.routes";
import { batchRouter } from "./routes/batch.routes";
import { userRouter } from "./routes/user.routes";

app.use("/api/auth", authRouter);
app.use("/api/projects", projectRouter);
app.use("/api/spools", spoolRouter);
app.use("/api/batches", batchRouter);
app.use("/api/user", userRouter);

// Basic health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

export default app;
