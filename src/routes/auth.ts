import express from "express";
import { AuthController } from "../controllers/auth";
import { authenticateAccessToken } from "../middleware/authenticateToken";
import {
  signUpValidation,
  loginValidation,
  logoutValidation,
} from "../utils/validation";

const authRouter = express.Router();
const controller = new AuthController();

authRouter.post("/signup", async (req, res) => {
  const { error, value: body } = signUpValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  try {
    const response = await controller.signup(body);
    res.send(response);
  } catch (err: any) {
    res.status(err.code).send(err.message);
  }
});

authRouter.post("/login", async (req, res) => {
  const { error, value: body } = loginValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  try {
    const response = await controller.login(body);
    res.send(response);
  } catch (err: any) {
    res.status(err.code).send(err.message);
  }
});

authRouter.delete("/logout", authenticateAccessToken, async (req, res) => {
  // const { error, value: body } = logoutValidation(req.body);
  // if (error) return res.status(400).send(error.details[0].message);
  try {
    await controller.logout(req);
  } catch (err: any) {
    res.status(err.code).send(err.message);
  }
  res.sendStatus(204);
});

export default authRouter;
