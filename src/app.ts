import express, { Express } from 'express'
import dotenv from 'dotenv'
import mongoose, { ConnectOptions } from 'mongoose'
import router from './routes'
import session from 'express-session'
import cookieParser from 'cookie-parser'

dotenv.config()

const app: Express = express()

app.use(express.json())
app.use('/', router)

const port = process.env.PORT

app.listen(`${port}`, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
})

mongoose.Promise = Promise
mongoose
  .connect(`${process.env.MONGO_URI}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  } as ConnectOptions)
  .then(() => {
    console.log('MongoDB Connected')
  })
  .catch((err) => {
    console.error('MongoDB Connection Error: ', err)
  })
