import express from 'express'
import { PetController } from '../controllers/pet'
import { authenticateAccessToken } from '../middleware/authenticateToken'
import { isShelter } from '../middleware/isShelter'
import { PetRequest } from '../types/PetRequest'
import upload from '../middleware/uploadFiles'
import { uploadFiles } from '../utils/uploadFiles'
import { addPetValidation, getAllPetsValidation } from '../utils/validation'

const petRouter = express.Router()
const petController = new PetController()

petRouter.post(
  '/',
  authenticateAccessToken,
  isShelter,
  upload.array('images', 10),
  async (req, res) => {
    if ((req as PetRequest).files) {
      if (((req as PetRequest).files.length as number) > 10) {
        return res.status(400).send('You can add a maximum of 10 images')
      }
    } else {
      return res.status(400).send('Images are required')
    }
    const { error } = addPetValidation(req.body)
    if (error) return res.status(400).send(error.details[0].message)
    try {
      const {
        microchipID,
        name,
        gender,
        birthDate,
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
      const fileIds = await uploadFiles((req as PetRequest).files, req)

      const response = await petController.addPet(
        microchipID,
        name,
        gender,
        birthDate,
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
    const { error } = getAllPetsValidation(req.query)
    if (error) {
      return res.status(400).send(error.details[0].message)
    }
    const {
      page = '1',
      limit = '3',
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
