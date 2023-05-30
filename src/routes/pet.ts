import express from 'express'
import { PetController } from '../controllers/pet'
import { PetRequest } from '../types/PetRequest'
import upload from '../middleware/multer'
import { addPetValidation } from '../utils/validation'
import { authenticateAccessToken } from '../middleware/authenticateToken'
import { isShelter } from '../middleware/isShelter'

const petRouter = express.Router()
const petController = new PetController()

petRouter.post('/', isShelter, async (req, res) => {
  upload.single('image')(req, res, async (err: any) => {
    if (err) {
      // Handle Multer error
      return res.status(400).send('Only image files are allowed.')
    }
    const { error } = addPetValidation(req.body)
    console.log(req.body)
    if (error) {
      console.log('Validation error')
      return res.status(400).send(error.details[0].message)
    }
    try {
      const response = await petController.addPet(
        req.body.name,
        req.body.age,
        req.body.color,
        req.body.bio,
        (req as PetRequest).file,
        req
      )
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  })
})

petRouter.get('/', authenticateAccessToken, async (req, res) => {
  const page = parseInt(req.query.page as string)
  const limit = parseInt(req.query.limit as string)

  try {
    const response = await petController.getAllPets(page, limit, req)
    res.send(response)
  } catch (err: any) {
    res.status(err.code).send(err.message)
  }
})

export default petRouter
