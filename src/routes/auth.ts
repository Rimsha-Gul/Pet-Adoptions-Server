import express from "express";
import { AuthController } from "../controllers/auth";
import { authenticateAccessToken } from "../middleware/authenticateToken";

const authRouter = express.Router();
const controller = new AuthController();

authRouter.post("/signup", async (req, res) => {
  try {
    const response = await controller.signup(req);
    res.send(response);
  } catch (err: any) {
    res.status(err.code).send(err.message);
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const response = await controller.login(req);
    res.send(response);
  } catch (err: any) {
    res.status(err.code).send(err.message);
  }
});

authRouter.delete("/logout", authenticateAccessToken, async (req, res) => {
  try {
    await controller.logout(req);
  } catch (err: any) {
    res.status(err.code).send(err.message);
  }
  res.sendStatus(204);
});

export default authRouter;
