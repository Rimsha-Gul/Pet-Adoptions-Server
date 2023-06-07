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
    @FormField() microchip: boolean,
    @FormField() wormed: boolean,
    @FormField() heartwormTreated: boolean,
    @FormField() vaccinated: boolean,
    @FormField() deSexed: boolean,
    @FormField() bio: string,
    @FormField() traits: string,
    @FormField() adoptionFee: string,
    @UploadedFiles() images: Express.Multer.File[],
    @Request() req: UserRequest
  ): Promise<PetResponse> {
    return addPet(
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
      microchip,
      wormed,
      heartwormTreated,
      vaccinated,
      deSexed,
      bio,
      traits,
      adoptionFee,
      images,
      req
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
}

const addPet = async (
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
  microchip: boolean,
  wormed: boolean,
  heartwormTreated: boolean,
  vaccinated: boolean,
  deSexed: boolean,
  bio: string,
  traits: string,
  adoptionFee: string,
  images: Express.Multer.File[],
  req: UserRequest
): Promise<PetResponse> => {
  if (!images) {
    throw { code: 400, message: 'No image file provided.' }
  }
  const petImages: string[] = images.map((image) => image.filename)

  const pet = new Pet({
    shelterId: (req.user as RequestUser)._id,
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
      microchip: microchip,
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
  req: ExpressRequest,
  searchQuery?: string,
  filterOption?: string,
  colorFilter?: string,
  breedFilter?: string,
  genderFilter?: string,
  ageFilter?: string
): Promise<PetsResponse> => {
  try {
    const skip = (page - 1) * limit
    let query = Pet.find()

    let colors: string[] = []
    let breeds: string[] = []
    let genders: string[] = []
    let ages: string[] = []

    // Apply category filter if a filter option is provided
    if (filterOption) {
      console.log('Filtering')
      query = query.find({ category: filterOption })

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
      query = query.find({ color: colorFilter })
    }

    // Apply breed filter if a breedFilter option is provided
    if (breedFilter) {
      console.log('Filtering by breed')
      query = query.find({ breed: breedFilter })
    }

    // Apply gender filter if a genderFilter option is provided
    if (genderFilter) {
      console.log('Filtering by gender')
      query = query.find({ gender: genderFilter })
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
        query = query.find({
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
        })
      } else if (!isNaN(minAge)) {
        // Only minAge is provided
        query = query.find({ age: { $gte: minAge } })
      } else if (!isNaN(maxAge)) {
        // Only maxAge is provided
        query = query.find({ age: { $lte: maxAge } })
      }
    }

    // Apply search filter if a search query is provided
    if (searchQuery) {
      query = query.find({
        $and: [
          { color: colorFilter },
          { breed: breedFilter },
          { gender: genderFilter },
          { age: ageFilter },
          {
            $or: [
              { name: { $regex: searchQuery, $options: 'i' } },
              { bio: { $regex: searchQuery, $options: 'i' } }
            ]
          }
        ]
      })
    }

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
            (image) => `${req.protocol}://${req.get('host')}/uploads/${image}`
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
