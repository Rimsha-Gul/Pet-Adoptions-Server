import {
  ActivityNeeds,
  Category,
  Gender,
  LevelOfGrooming,
  PetPayload,
  PetResponse,
  PetsResponse
} from '../models/Pet'
import {
  Example,
  FormField,
  Get,
  Post,
  Query,
  Request,
  Route,
  Security,
  Tags,
  UploadedFiles
} from 'tsoa'
import Pet from '../models/Pet'
import { Request as ExpressRequest } from 'express'
import { UserRequest } from '../types/Request'
import { RequestUser } from '../types/RequestUser'
import { petResponseExample, petsResponseExample } from '../examples/pet'
import { User } from '../models/User'
import { drive, getOrCreateFolder } from '../middleware/uploadFiles'
import path from 'path'
import { Readable } from 'stream'

@Route('pet')
@Tags('Pet')
export class PetController {
  /**
   * @summary Accepts pet info, adds pet to db and returns pet info
   *
   */
  @Example<PetPayload>(petResponseExample)
  @Security('bearerAuth')
  @Post('/')
  public async addPet(
    @FormField() microchipID: string,
    @FormField() name: string,
    @FormField() gender: Gender,
    @FormField() age: string,
    @FormField() color: string,
    @FormField() breed: string,
    @FormField() category: Category,
    @FormField() activityNeeds: ActivityNeeds,
    @FormField() levelOfGrooming: LevelOfGrooming,
    @FormField() isHouseTrained: boolean,
    @FormField() healthCheck: boolean,
    @FormField() allergiesTreated: boolean,
    @FormField() wormed: boolean,
    @FormField() heartwormTreated: boolean,
    @FormField() vaccinated: boolean,
    @FormField() deSexed: boolean,
    @FormField() bio: string,
    @FormField() traits: string,
    @FormField() adoptionFee: string,
    @UploadedFiles() images: string[],
    @Request() req: UserRequest,
    @FormField() shelterID?: string
  ): Promise<PetResponse> {
    return addPet(
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
      images,
      req,
      shelterID
    )
  }

  /**
   * @summary Returns all pets
   *
   */
  @Example<PetsResponse>(petsResponseExample)
  @Security('bearerAuth')
  @Get('/')
  public async getAllPets(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Request() req: ExpressRequest,
    @Query('searchQuery') searchQuery?: string,
    @Query('filterOption') filterOption?: string,
    @Query('colorFilter') colorFilter?: string,
    @Query('breedFilter') breedFilter?: string,
    @Query('genderFilter') genderFilter?: string,
    @Query('ageFilter') ageFilter?: string
  ): Promise<PetsResponse> {
    return getAllPets(
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
  }

  public async uploadFiles(
    files: Express.Multer.File[],
    req: UserRequest
  ): Promise<string[]> {
    const fileIds: string[] = []

    for (const file of files) {
      const shelterID = req.body.shelterID
        ? req.body.shelterID
        : (req.user as RequestUser)._id

      const shelterIDFolderId = await getOrCreateFolder(
        drive,
        shelterID.toString(),
        process.env.DRIVE_PARENT_FOLDER_ID || ''
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

    return fileIds
  }
}

const addPet = async (
  microchipID: string,
  name: string,
  gender: string,
  age: string,
  color: string,
  breed: string,
  category: Category,
  activityNeeds: ActivityNeeds,
  levelOfGrooming: LevelOfGrooming,
  isHouseTrained: boolean,
  healthCheck: boolean,
  allergiesTreated: boolean,
  wormed: boolean,
  heartwormTreated: boolean,
  vaccinated: boolean,
  deSexed: boolean,
  bio: string,
  traits: string,
  adoptionFee: string,
  images: string[],
  req: UserRequest,
  shelterID?: string
): Promise<PetResponse> => {
  // Retrieve the IDs of users with the role "shelter"
  const shelterUsers = await User.find({ role: 'SHELTER' }, '_id')
  const shelterUserIds = shelterUsers.map((user) => user._id.toString())

  // Check if the shelterID matches any of the shelter user IDs
  if (shelterID && !shelterUserIds.includes(shelterID)) {
    throw { code: 400, message: 'Invalid shelter ID.' }
  }

  if (!images) {
    throw { code: 400, message: 'No image file provided.' }
  }
  const petImages: string[] = images
  const pet = new Pet({
    shelterID: shelterID ? shelterID : (req.user as RequestUser)._id,
    microchipID: microchipID,
    name: name,
    gender: gender,
    age: age,
    color: color,
    breed: breed,
    category: category,
    activityNeeds: activityNeeds,
    levelOfGrooming: levelOfGrooming,
    isHouseTrained: isHouseTrained,
    healthInfo: {
      healthCheck: healthCheck,
      allergiesTreated: allergiesTreated,
      wormed: wormed,
      heartwormTreated: heartwormTreated,
      vaccinated: vaccinated,
      deSexed: deSexed
    },
    bio: bio,
    traits: traits.split(','),
    adoptionFee: adoptionFee,
    images: petImages
  })

  await pet.save()

  return {
    microchipID: pet.microchipID,
    name: pet.name,
    gender: pet.gender,
    age: pet.age,
    color: pet.color,
    breed: pet.breed,
    bio: pet.bio,
    images: pet.images
  }
}

const getAllPets = async (
  page = 1,
  limit = 3,
  _req: ExpressRequest,
  searchQuery?: string,
  filterOption?: string,
  colorFilter?: string,
  breedFilter?: string,
  genderFilter?: string,
  ageFilter?: string
): Promise<PetsResponse> => {
  try {
    console.log(filterOption)
    console.log(colorFilter)
    console.log(breedFilter)
    console.log(genderFilter)
    console.log(ageFilter)
    const skip = (page - 1) * limit
    const queryObj: { [key: string]: any } = {}

    let colors: string[] = []
    let breeds: string[] = []
    let genders: string[] = []
    let ages: string[] = []

    // Apply category filter if a filter option is provided
    if (filterOption) {
      console.log('Filtering')
      queryObj.category = filterOption

      // Fetch all pets of this category to get unique colors, breeds, genders, and ages
      const allPetsOfCategory = await Pet.find({
        category: filterOption
      }).exec()
      colors = Array.from(new Set(allPetsOfCategory.map((pet) => pet.color)))
      breeds = Array.from(new Set(allPetsOfCategory.map((pet) => pet.breed)))
      genders = Array.from(new Set(allPetsOfCategory.map((pet) => pet.gender)))
      ages = Array.from(new Set(allPetsOfCategory.map((pet) => pet.age)))
    }

    // Apply color filter if a colorFilter option is provided
    if (colorFilter) {
      console.log('Filtering by color')
      queryObj.color = colorFilter
      // query = query.find({ color: colorFilter })
    }

    // Apply breed filter if a breedFilter option is provided
    if (breedFilter) {
      console.log('Filtering by breed')
      queryObj.breed = breedFilter
      //query = query.find({ breed: breedFilter })
    }

    // Apply gender filter if a genderFilter option is provided
    if (genderFilter) {
      console.log('Filtering by gender')
      queryObj.gender = genderFilter
      // query = query.find({ gender: genderFilter })
    }

    // Apply age filter if an ageFilter option is provided
    if (ageFilter) {
      console.log('Filtering by age range')
      console.log(ageFilter)

      const [minAge, maxAge] = ageFilter.split('-').map((age) => parseInt(age))
      console.log(minAge)
      console.log(maxAge)

      if (!isNaN(minAge) && !isNaN(maxAge)) {
        // Both minAge and maxAge are provided
        queryObj.age = {
          $or: [
            {
              $and: [
                { age: { $gte: `${minAge}yr` } },
                { age: { $lte: `${maxAge}yr` } }
              ]
            },
            {
              $and: [
                { age: { $eq: `${minAge}yr` } },
                { age: { $gte: `${minAge}m` } }
              ]
            },
            {
              $and: [
                { age: { $eq: `${maxAge}yr` } },
                { age: { $lte: `${maxAge}m` } }
              ]
            }
          ]
        }
      } else if (!isNaN(minAge)) {
        // Only minAge is provided
        queryObj.age = { $gte: minAge }
      } else if (!isNaN(maxAge)) {
        // Only maxAge is provided
        queryObj.age = { $lte: maxAge }
      }
    }

    // Apply search filter if a search query is provided
    if (searchQuery) {
      queryObj.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { bio: { $regex: searchQuery, $options: 'i' } }
      ]
    }
    let query = Pet.find(queryObj)
    // Count total number of pets without applying pagination
    const totalPetsPromise = Pet.countDocuments(query)

    // Apply pagination to the query
    query = query.skip(skip).limit(limit)

    const [petsList, totalPets] = await Promise.all([query, totalPetsPromise])

    console.log('Total pets:', totalPets)

    // Map the petsList to include the image URL
    const petsWithImageUrls = await Promise.all(
      petsList.map(async (pet) => {
        const { images, ...petWithoutImages } = pet.toObject()
        const imageUrls = await Promise.all(
          images.map(
            (image) => `https://drive.google.com/uc?export=view&id=${image}`
          )
        )
        return {
          ...petWithoutImages,
          images: imageUrls
        }
      })
    )

    const totalPages = Math.ceil(totalPets / limit)

    return {
      pets: petsWithImageUrls,
      totalPages,
      colors,
      breeds,
      genders,
      ages
    }
  } catch (error: any) {
    throw { code: 500, message: 'Failed to fetch pets' }
  }
}
