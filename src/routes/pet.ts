import express from 'express'
import { PetController } from '../controllers/pet'
import { PetRequest } from '../types/PetRequest'
import upload from '../middleware/multer'
import { addPetValidation, getAllPetsValidation } from '../utils/validation'
import { authenticateAccessToken } from '../middleware/authenticateToken'
import { isShelter } from '../middleware/isShelter'

const petRouter = express.Router()
const petController = new PetController()

petRouter.post('/', authenticateAccessToken, isShelter, async (req, res) => {
  console.log('Inside router')
  upload.array('images', 10)(req, res, async (err: any) => {
    if (err) {
      // Handle Multer error
      return res.status(400).send('Only image files are allowed.')
    }
    const { error } = addPetValidation(req.body)
    console.log(req.body)
    if (error) {
      console.log('Validation error')
      return res.status(400).send(error.details)
    }
    try {
      const response = await petController.addPet(
        req.body.name,
        req.body.gender,
        req.body.age,
        req.body.color,
        req.body.breed,
        req.body.category,
        req.body.activityNeeds,
        req.body.levelOfGrooming,
        req.body.isHouseTrained,
        req.body.healthCheck,
        req.body.microchip,
        req.body.wormed,
        req.body.heartwormTreated,
        req.body.vaccinated,
        req.body.deSexed,
        req.body.bio,
        req.body.traits,
        req.body.adoptionFee,
        (req as PetRequest).files,
        req
      )
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  })
})

petRouter.get('/', authenticateAccessToken, async (req, res) => {
  const { error } = getAllPetsValidation(req.body)
  console.log(req.body)
  if (error) {
    console.log('Validation error')
    return res.status(400).send(error.details)
  }
  try {
    const page = parseInt(req.query.page as string)
    const limit = parseInt(req.query.limit as string)
    const searchQuery = req.query.searchQuery as string
    const filterOption = req.query.filterOption as string
    const colorFilter = req.query.colorFilter as string
    const breedFilter = req.query.breedFilter as string
    const genderFilter = req.query.genderFilter as string
    const ageFilter = req.query.ageFilter as string
    console.log('page: ', page)
    console.log('limit:', limit)
    const response = await petController.getAllPets(
      page,
      limit,
      req,
      searchQuery,
      filterOption,
      colorFilter,
      breedFilter,
      genderFilter,
      ageFilter
    )
    return res.send(response)
  } catch (err: any) {
    return res.status(err.code).send(err.message)
  }
})

export default petRouter
