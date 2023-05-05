import express, { Express, Request, Response } from "express";
import http from "http";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
import mongoose, { ConnectOptions } from "mongoose";
import router from "./src/routes";
// import userRouter from "./src/routes/userRouter";

dotenv.config();

const app: Express = express();

// app.use(
//   cors({
//     credentials: true,
//   })
// );

// app.use(compression());
// app.use(cookieParser());
// app.use(bodyParser.json());
app.use(express.json());

const port = process.env.PORT;

const server = http.createServer(app);

server.listen(`${port}`, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

mongoose.Promise = Promise;
mongoose
  .connect(`${process.env.MONGO_URI}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as ConnectOptions)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.error("MongoDB Connection Error: ", err);
  });

app.use("/", router());
// app.get('/', (req: Request, res: Response) => {
//   res.send('Express + TypeScript Server.');
// });

// app.listen(port, () => {
//   console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
// });

// app.use(express.json());

// app.use("/users", userRouter);

// const connectToDatabase = async () => {
//   try {
//     await mongoose.connect("mongodb://localhost:27017/myapp", {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     } as ConnectOptions);
//     console.log("Connected to MongoDB database!");
//   } catch (error) {
//     console.error("Error connecting to MongoDB database:", error);
//   }
// };

// const startServer = async () => {
//   await connectToDatabase();
//   app.listen(port, () => {
//     console.log(`Server started at http://localhost:${port}`);
//   });
// };

// startServer();

// app.listen(port, () => {
//   console.log(`Server listening at http://localhost:${port}`);
// });

// mongoose
//   .connect(`${process.env.MONGO_URI}`, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   } as ConnectOptions)
//   .then(() => {
//     console.log("MongoDB Connected");
//   })
//   .catch((err) => {
//     console.error("MongoDB Connection Error: ", err);
//   });
