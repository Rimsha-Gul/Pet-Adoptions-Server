import {
  ActivityNeeds,
  AddPetResponse,
  AllPetsResponse,
  Category,
  Gender,
  LevelOfGrooming
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
import { getImageURL } from '../utils/getImageURL'
import { calculateAgeFromBirthdate } from '../utils/calculateAgeFromBirthdate'
import Application from '../models/Application'

@Route('pet')
@Tags('Pet')
export class PetController {
  /**
   * @summary Accepts pet info, adds pet to db and returns pet info
   *
   */
  @Example<AddPetResponse>(petResponseExample)
  @Security('bearerAuth')
  @Post('/')
  public async addPet(
    @FormField() microchipID: string,
    @FormField() name: string,
    @FormField() gender: Gender,
    @FormField() birthDate: string,
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
  ): Promise<AddPetResponse> {
    return addPet(
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
      images,
      req,
      shelterID
    )
  }

  /**
   * @summary Returns details of a pet given its id
   *
   */
  @Example<AddPetResponse>(petResponseExample)
  @Security('bearerAuth')
  @Get('/')
  public async getPetDetails(
    @Request() req: ExpressRequest
  ): Promise<AddPetResponse> {
    return getPetDetails(req)
  }

  /**
   * @summary Returns all pets
   *
   */
  @Example<AllPetsResponse>(petsResponseExample)
  @Security('bearerAuth')
  @Get('/all')
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
  ): Promise<AllPetsResponse> {
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
}

const addPet = async (
  microchipID: string,
  name: string,
  gender: string,
  birthDate: string,
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
): Promise<AddPetResponse> => {
  if (!images || images.length === 0) {
    throw { code: 400, message: 'No image file provided.' }
  }

  const existingPet = await Pet.findOne({ microchipID: microchipID })
  if (existingPet) {
    throw {
      code: 400,
      message: 'Pet already exists'
    }
  }

  const shelter = await User.findById(
    shelterID ? shelterID : (req.user as RequestUser)._id
  )

  if (!shelter) throw { code: 404, message: 'Shelter not found' }
  else if (shelter.role !== 'SHELTER')
    throw { code: 400, message: 'User is not a shelter' }

  const petImages: string[] = images
  const parsedBirthDate: Date = new Date(birthDate)
  const pet = new Pet({
    shelterID: shelterID ? shelterID : (req.user as RequestUser)._id,
    shelterName: shelter.name,
    microchipID: microchipID,
    name: name,
    gender: gender,
    birthDate: parsedBirthDate,
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

  // Map the images to their URLs
  const imageUrls = await Promise.all(images.map((image) => getImageURL(image)))

  // Include the image URLs in the response
  return {
    pet: {
      ...pet.toObject(),
      images: imageUrls
    }
  }
}

const getPetDetails = async (req: UserRequest): Promise<AddPetResponse> => {
  const petID = req.query.id
  const pet = await Pet.findOne({ microchipID: petID })
  if (!pet) throw { code: 404, message: 'Pet not found' }

  const { birthDate, images, ...petWithoutImages } = pet.toObject()
  const imageUrls = await Promise.all(images.map((image) => getImageURL(image)))

  const petApplication = await Application.findOne({
    applicantEmail: req.user?.email,
    microchipID: pet.microchipID
  })
  const petHasAdoptionRequest = !!petApplication

  // If an application exists, include the application ID
  const applicationID = petApplication ? petApplication._id : null
  console.log(pet)
  return {
    pet: {
      ...petWithoutImages,
      birthDate: birthDate.toISOString().split('T')[0],
      images: imageUrls,
      hasAdoptionRequest: petHasAdoptionRequest,
      applicationID: applicationID
    }
  }
}

const getAllPets = async (
  page: number,
  limit: number,
  req: UserRequest,
  searchQuery?: string,
  filterOption?: string,
  colorFilter?: string,
  breedFilter?: string,
  genderFilter?: string,
  ageFilter?: string
): Promise<AllPetsResponse> => {
  try {
    const skip = (page - 1) * limit
    const queryObj: { [key: string]: any } = {}

    let colors: string[] = []
    let breeds: string[] = []
    let genders: string[] = []
    let ages: number[] = []

    // Apply category filter if a filter option is provided
    if (filterOption) {
      queryObj.category = filterOption

      // Fetch all pets of this category to get unique colors, breeds, genders, and ages
      const allPetsOfCategory = await Pet.find({
        category: filterOption
      }).exec()
      colors = Array.from(new Set(allPetsOfCategory.map((pet) => pet.color)))
      breeds = Array.from(new Set(allPetsOfCategory.map((pet) => pet.breed)))
      genders = Array.from(new Set(allPetsOfCategory.map((pet) => pet.gender)))
      ages = Array.from(
        new Set(
          allPetsOfCategory.map((pet) =>
            calculateAgeFromBirthdate(pet.birthDate)
          )
        )
      )

      // Apply color filter if a colorFilter option is provided
      if (colorFilter) {
        queryObj.color = colorFilter
      }

      // Apply breed filter if a breedFilter option is provided
      if (breedFilter) {
        queryObj.breed = breedFilter
      }

      // Apply gender filter if a genderFilter option is provided
      if (genderFilter) {
        queryObj.gender = genderFilter
      }

      // Apply age filter if an ageFilter option is provided
      if (ageFilter) {
        const [minAge, maxAge] = ageFilter
          .split('-')
          .map((age) => parseInt(age))

        if (!isNaN(minAge) && !isNaN(maxAge)) {
          const currentDate = new Date()
          const minBirthDate = new Date(
            currentDate.getFullYear() - minAge,
            currentDate.getMonth(),
            currentDate.getDate()
          )
          const maxBirthDate = new Date(
            currentDate.getFullYear() - maxAge - 1,
            currentDate.getMonth(),
            currentDate.getDate()
          )
          queryObj.birthDate = {
            $gte: maxBirthDate,
            $lte: minBirthDate
          }
        } else if (!isNaN(minAge)) {
          const currentDate = new Date()
          const minBirthDate = new Date(
            currentDate.getFullYear() - minAge,
            currentDate.getMonth(),
            currentDate.getDate()
          )

          queryObj.birthDate = { $lte: minBirthDate }
        } else if (!isNaN(maxAge)) {
          const currentDate = new Date()
          const maxBirthDate = new Date(
            currentDate.getFullYear() - maxAge - 1,
            currentDate.getMonth(),
            currentDate.getDate()
          )

          queryObj.birthDate = { $gte: maxBirthDate }
        }
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

    // Map the petsList to include the image URL
    const petsWithImageUrls = await Promise.all(
      petsList.map(async (pet) => {
        const { birthDate, images, ...petWithoutImages } = pet.toObject()
        const imageUrls = await Promise.all(
          images.map((image) => getImageURL(image))
        )

        const petApplication = await Application.findOne({
          applicantEmail: req.user?.email,
          microchipID: pet.microchipID
        })
        const petHasAdoptionRequest = !!petApplication

        // If an application exists, include the application ID
        const applicationID = petApplication ? petApplication._id : null

        return {
          ...petWithoutImages,
          birthDate: birthDate.toISOString().split('T')[0],
          images: imageUrls,
          hasAdoptionRequest: petHasAdoptionRequest,
          applicationID: applicationID
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
