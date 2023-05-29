import { PetResponse } from '../models/Pet'
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
  UploadedFile
} from 'tsoa'
import Pet from '../models/Pet'
import { Request as ExpressRequest } from 'express'

@Route('pet')
@Tags('Pet')
export class PetController {
  /**
   * @summary Accepts pet info, adds pet to db and returns pet info
   *
   */
  @Example<PetResponse>({
    shelterId: 1,
    name: 'Meredith',
    age: 1,
    color: 'Gray',
    bio: 'Meredith is a playful and friendly cat. She loves chasing laser pointers and enjoys cuddling on the couch.',
    image: 'meredith.jpg'
  })
  @Post('/')
  public async addPet(
    @FormField() shelterId: number,
    @FormField() name: string,
    @FormField() age: number,
    @FormField() color: string,
    @FormField() bio: string,
    @UploadedFile() image: any
  ): Promise<PetResponse> {
    return addPet(shelterId, name, age, color, bio, image)
  }

  /**
   * @summary Returns all pets
   *
   */
  @Example<PetResponse[]>([
    {
      shelterId: 1,
      name: 'Meredith',
      age: 1,
      color: 'Gray',
      bio: 'Meredith is a playful and friendly cat. She loves chasing laser pointers and enjoys cuddling on the couch.',
      image: 'meredith.jpg'
    },
    {
      shelterId: 1,
      name: 'Olivia',
      age: 1,
      color: 'White',
      bio: 'Olivia is a sweet and gentle cat. She enjoys sunbathing by the window and loves being brushed.',
      image: 'olivia.jpg'
    }
  ])
  @Security('bearerAuth')
  @Get('/')
  public async getAllPets(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Request() req: ExpressRequest
  ): Promise<PetResponse[]> {
    return getAllPets(page, limit, req)
  }
}

const addPet = async (
  shelterId: number,
  name: string,
  age: number,
  color: string,
  bio: string,
  image: any
): Promise<PetResponse> => {
  console.log('entered controller')
  // const { shelterId, name, age, color, bio } = body
  if (!image) {
    throw { code: 400, message: 'No image file provided.' }
  }
  console.log('inside controller')
  const petimage = image.filename
  console.log(petimage)

  const existingPet = await Pet.findOne({
    shelterId: shelterId,
    name: name,
    age: age,
    color: color,
    bio: bio,
    image: petimage
  })

  if (existingPet) {
    throw { code: 409, message: 'Pet already exists.' }
  }

  const pet = new Pet({
    shelterId: shelterId,
    name: name,
    age: age,
    color: color,
    bio: bio,
    image: petimage
  })

  await pet.save()

  return {
    shelterId: pet.shelterId,
    name: pet.name,
    age: pet.age,
    color: pet.color,
    bio: pet.bio,
    image: pet.image
  }
}

const getAllPets = async (
  page = 1,
  limit = 2,
  req: ExpressRequest
): Promise<PetResponse[]> => {
  try {
    const skip = (page - 1) * limit
    const petsList = await Pet.find().skip(skip).limit(limit)
    // Map the petsList to include the image URL
    const petsWithImageUrl = petsList.map((pet) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { image, ...petWithoutImage } = pet.toObject()
      return {
        ...petWithoutImage,
        image: `${req.protocol}://${req.get('host')}/uploads/${pet.image}`
      }
    })
    return petsWithImageUrl
  } catch (error: any) {
    throw { code: 500, message: 'Failed to fetch pets' }
  }
}
