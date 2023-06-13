import express from 'express'
import { PetController } from '../controllers/pet'
import { authenticateAccessToken } from '../middleware/authenticateToken'
import { isShelter } from '../middleware/isShelter'
import { PetRequest } from '../types/PetRequest'
import upload from '../middleware/uploadFiles'
import { uploadFiles } from '../utils/uploadFiles'

const petRouter = express.Router()
const petController = new PetController()

petRouter.post(
  '/',
  authenticateAccessToken,
  isShelter,
  upload.array('images', 10),
  async (req, res) => {
    try {
      const {
        microchipID,
        name,
        gender,
        age,
        color,
        breed,
        category,
        activityNeeds,
        levelOfGrooming,
        isHouseTrained,
        healthCheck,
        allergiesTreated,
        wormed,
        heartwormTreated,
        vaccinated,
        deSexed,
        bio,
        traits,
        adoptionFee,
        shelterID
      } = req.body
      console.log(req.body)
      const fileIds = await uploadFiles((req as PetRequest).files, req)

      const response = await petController.addPet(
        microchipID,
        name,
        gender,
        age,
        color,
        breed,
        category,
        activityNeeds,
        levelOfGrooming,
        isHouseTrained,
        healthCheck,
        allergiesTreated,
        wormed,
        heartwormTreated,
        vaccinated,
        deSexed,
        bio,
        traits,
        adoptionFee,
        fileIds,
        req,
        shelterID
      )
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  }
)

petRouter.get('/', authenticateAccessToken, async (req, res) => {
  try {
    const {
      page,
      limit,
      searchQuery,
      filterOption,
      colorFilter,
      breedFilter,
      genderFilter,
      ageFilter
    } = req.query

    const response = await petController.getAllPets(
      parseInt(page as string),
      parseInt(limit as string),
      req,
      searchQuery as string,
      filterOption as string,
      colorFilter as string,
      breedFilter as string,
      genderFilter as string,
      ageFilter as string
    )
    return res.send(response)
  } catch (err: any) {
    return res.status(err.code).send(err.message)
  }
})

export default petRouter
