import dotenv from 'dotenv'
dotenv.config()
import express, { Express } from 'express'
import mongoose, { ConnectOptions } from 'mongoose'
import router from './routes'
import path from 'path'
import cors from 'cors'

const startApp = async () => {
  try {
    /***********************************
     *         Mongo DB Connection      *
     ***********************************/

    await mongoose
      .connect(`${process.env.MONGO_URI}`, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      } as ConnectOptions)
      .then(() => {
        console.log('MongoDB Connected')
      })
      .catch((err) => {
        console.error('MongoDB Connection Error: ', err)
        throw err
      })

    /***********************************
     *      Listening for requests     *
     ***********************************/
    const app: Express = express()

    app.use(express.json())
    app.use(cors())

    app.use(express.static(path.join(__dirname, '../public')))
    app.use('/uploads', express.static(path.join(__dirname, '../uploads')))
    app.use('/', router)

    const port = process.env.PORT

    app.listen(`${port}`, () => {
      console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
    })
  } catch (err) {
    console.error('Error starting the server: ', err)
  }
}

startApp()
