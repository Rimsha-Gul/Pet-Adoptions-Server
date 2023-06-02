import {
  ActivityNeeds,
  Category,
  Gender,
  LevelOfGrooming,
  PetResponse
} from '../models/Pet'
import {
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

@Route('pet')
@Tags('Pet')
export class PetController {
  /**
   * @summary Accepts pet info, adds pet to db and returns pet info
   *
   */
  // @Example<PetResponse>({
  //   shelterId: ObjectId('611e0c0b1234567890123456'),
  //   name: 'Meredith',
  //   age: 1,
  //   color: 'Gray',
  //   bio: 'Meredith is a playful and friendly cat. She loves chasing laser pointers and enjoys cuddling on the couch.',
  //   image: 'meredith.jpg'
  // })
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
  // @Example<PetResponse[]>([
  //   {
  //     shelterId: 1,
  //     name: 'Meredith',
  //     age: 1,
  //     color: 'Gray',
  //     bio: 'Meredith is a playful and friendly cat. She loves chasing laser pointers and enjoys cuddling on the couch.',
  //     image: 'meredith.jpg'
  //   },
  //   {
  //     shelterId: 1,
  //     name: 'Olivia',
  //     age: 1,
  //     color: 'White',
  //     bio: 'Olivia is a sweet and gentle cat. She enjoys sunbathing by the window and loves being brushed.',
  //     image: 'olivia.jpg'
  //   }
  // ])
  @Security('bearerAuth')
  @Get('/')
  public async getAllPets(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Request() req: ExpressRequest,
    @Query('searchQuery') searchQuery?: string,
    @Query('filterOption') filterOption?: string
  ): Promise<{ pets: PetResponse[]; totalPages: number }> {
    return getAllPets(page, limit, req, searchQuery, filterOption)
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
  filterOption?: string
): Promise<{ pets: PetResponse[]; totalPages: number }> => {
  try {
    const skip = (page - 1) * limit
    let query = Pet.find()

    // Apply search filter if a search query is provided
    if (searchQuery) {
      query = query.find({
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { color: { $regex: searchQuery, $options: 'i' } },
          { bio: { $regex: searchQuery, $options: 'i' } }
        ]
      })
    }

    // Apply category filter if a filter option is provided
    if (filterOption) {
      console.log('Filtering')
      query = query.find({ category: filterOption })
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
    return { pets: petsWithImageUrls, totalPages }
  } catch (error: any) {
    throw { code: 500, message: 'Failed to fetch pets' }
  }
}
