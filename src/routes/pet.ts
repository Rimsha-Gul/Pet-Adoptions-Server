import express from 'express'
import { PetController } from '../controllers/pet'
import { PetRequest } from '../types/PetRequest'
import upload, { drive, getOrCreateFolder } from '../middleware/multer'
import { addPetValidation, getAllPetsValidation } from '../utils/validation'
import { authenticateAccessToken } from '../middleware/authenticateToken'
import { isShelter } from '../middleware/isShelter'
import { RequestUser } from '../types/RequestUser'
import { UserRequest } from '../types/Request'
import { Readable } from 'stream'
import path from 'path'

const petRouter = express.Router()
const petController = new PetController()

petRouter.post('/', authenticateAccessToken, isShelter, async (req, res) => {
  upload.array('images', 10)(req, res, async () => {
    const fileIds: string[] = []

    for (const file of (req as PetRequest).files) {
      const shelterID = req.body.shelterID
        ? req.body.shelterID
        : ((req as UserRequest).user as RequestUser)._id

      const shelterIDFolderId = await getOrCreateFolder(
        drive,
        shelterID.toString(),
        '1DYuc-zpuvpwpjmezU2o9TIP_jOibsYBc'
      )

      const originalFilename = file.originalname
      const filenameWithoutExtension = path.parse(originalFilename).name
      const currentDate = new Date()
      const month = currentDate.getMonth() + 1
      const date = currentDate.getDate()
      const year = currentDate.getFullYear()
      const formattedDate = `${month}-${date}-${year}`
      const uniqueSuffix = formattedDate + '-' + Math.round(Math.random() * 1e9)
      const filename =
        filenameWithoutExtension +
        '-' +
        req.body.microchipID +
        '-' +
        uniqueSuffix

      const fileMetadata = {
        name: filename,
        parents: [shelterIDFolderId]
      }

      const readableStream = new Readable()
      readableStream.push(file.buffer)
      readableStream.push(null) // Indicates the end of stream

      const media = {
        mimeType: file.mimetype,
        body: readableStream
      }

      try {
        const response = await drive.files.create({
          requestBody: fileMetadata,
          media: media,
          fields: 'id'
        })

        if (response.data.id) {
          fileIds.push(response.data.id)
        } else {
          throw {
            code: 500,
            message: 'Failed to get the file ID from Google Drive.'
          }
        }
      } catch (err) {
        throw { code: 500, message: err.message }
      }
    }

    const { error } = addPetValidation(req.body)
    if (error) {
      console.log('Validation error')
      return res.status(400).send(error.details[0].message)
    }
    try {
      const response = await petController.addPet(
        req.body.microchipID,
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
        req.body.allergiesTreated,
        req.body.wormed,
        req.body.heartwormTreated,
        req.body.vaccinated,
        req.body.deSexed,
        req.body.bio,
        req.body.traits,
        req.body.adoptionFee,
        fileIds,
        req,
        req.body.shelterID
      )
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  })
})

petRouter.get('/', authenticateAccessToken, async (req, res) => {
  const { error } = getAllPetsValidation(req.query)
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
