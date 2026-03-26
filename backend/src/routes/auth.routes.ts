import { Router } from "express";
import { auth } from "../config/auth";

export const authRouter = Router();

authRouter.all("/*", (req, res, next) => {
  // Pass the request and response to Better Auth's handler
  // which will manage /api/auth/sign-in, /api/auth/sign-up, etc.
  auth.handler(req, res);
});
