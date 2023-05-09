import express from "express";
import authRouter from "./auth";
import sessionRouter from "./session";

const router = express.Router();

router.use("/auth", authRouter);
router.use("/session", sessionRouter);

export default router;
