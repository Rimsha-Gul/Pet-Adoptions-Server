import { Request, Response } from "express";
import { createUser, getUserByEmail } from "../models/User";
import { random } from "../helpers";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export const signup = async (req: Request, res: Response) => {
  // existing user check
  // hashed password
  // user creation
  // token generation
  try {
    const { name, email, password, address } = req.body;
    if (!name || !email || !password || !address) {
      return res.status(400).json("User already exists.");
    }

    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      return res.status(400);
    }

    const salt = random();
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser({
      name,
      email,
      address,
      password: hashedPassword,
    });
    const SECRET = process.env.ACCESS_TOKEN_SECRET;
    const token = jwt.sign({ email: user.email, id: user._id }, `${SECRET}`, {
      expiresIn: "1m",
    });
    return res.status(200).json({ user, token }).end();
  } catch (error) {
    console.log(error);
    return res.status(400);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400);
    }

    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const expectedPassword = await bcrypt.compare(password, user.password);
    if (!expectedPassword) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const SECRET = process.env.ACCESS_TOKEN_SECRET;
    const token = jwt.sign({ email: user.email, id: user._id }, `${SECRET}`);
    await user.save();
    return res.status(200).json({ user, token }).end();
  } catch (error) {
    console.log(error);
    return res.status(400);
  }
};
