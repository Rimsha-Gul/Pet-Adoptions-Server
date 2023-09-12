import express from 'express'
import { TestController } from '../controllers/test-db'

const testRouter = express.Router()
const controller = new TestController()

testRouter.post('/seed', async (_req, res) => {
  try {
    const response = await controller.seedDB()
    return res.send(response)
  } catch (err: any) {
    return res.status(err.code).send(err.message)
  }
})

testRouter.delete('/clear', async (_req, res) => {
  try {
    const response = await controller.clearDB()
    return res.send(response)
  } catch (err: any) {
    return res.status(err.code).send(err.message)
  }
})

testRouter.get('/getResetToken', async (_req, res) => {
  try {
    const response = await controller.getResetToken()
    return res.send(response)
  } catch (err: any) {
    return res.status(err.code).send(err.message)
  }
})

testRouter.post('/seedPets', async (_req, res) => {
  try {
    const response = await controller.seedPetsDB()
    return res.send(response)
  } catch (err: any) {
    return res.status(err.code).send(err.message)
  }
})

export default testRouter
