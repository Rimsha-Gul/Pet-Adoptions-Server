import dotenv from 'dotenv'
dotenv.config()
import express, { Express } from 'express'
import mongoose, { ConnectOptions } from 'mongoose'
import router from './routes'
import path from 'path'
import cors from 'cors'
import Cron from './cron'

const app: Express = express()

app.use(express.json())
app.use(cors())

app.use(express.static(path.join(__dirname, '../public')))
app.use('/', router)

/***********************************
 *        Mongo DB Connection      *
 ***********************************/

// NOTE: when exporting app.js as agent for supertest
// we should exclude connecting to the real database

let dbPromise: Promise<void> | null = null

let uri: string

if (process.env.NODE_ENV === 'test') {
  uri = `${process.env.MONGO_URI_TEST}`
} else {
  uri = `${process.env.MONGO_URI_DEV}`
}

dbPromise = mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  } as ConnectOptions)
  .then(() => {
    if (process.env.NODE_ENV !== 'test') {
      Cron()
    }
    console.log('MongoDB Connected')
  })
  .catch((err) => {
    console.error('MongoDB Connection Error: ', err)
    throw err
  })

export { app, dbPromise }
