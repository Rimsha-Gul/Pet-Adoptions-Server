import express from "express";
import { SessionController } from "../controllers/session";
import { authenticateAccessToken } from "../middleware/authenticateToken";
//import { sessionValidation } from "../utils/validation";

const sessionRouter = express.Router();

sessionRouter.get("/", authenticateAccessToken, async (req, res) => {
  // const { error, value: body } = sessionValidation(req.body);
  // if (error) return res.status(400).send(error.details[0].message);
  const controller = new SessionController();
  try {
    const response = await controller.session(req);
    res.send(response);
  } catch (err: any) {
    res.status(403).send(err.message);
  }
});

export default sessionRouter;
