import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import mongoose, { ConnectOptions } from "mongoose";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server.');
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});


mongoose.connect(`${process.env.MONGO_URI}`,{
  useNewUrlParser: true,
  useUnifiedTopology: true } as ConnectOptions)
  .then(() => {
    console.log('MongoDB Connected');
  })
  .catch((err) => {
    console.error('MongoDB Connection Error: ', err);
  });;
