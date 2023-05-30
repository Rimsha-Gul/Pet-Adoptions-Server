import { PetResponse } from '../models/Pet'
import {
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
    @FormField() age: number,
    @FormField() color: string,
    @FormField() bio: string,
    @UploadedFile() image: any,
    @Request() req: UserRequest
  ): Promise<PetResponse> {
    return addPet(name, age, color, bio, image, req)
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
    @Request() req: ExpressRequest
  ): Promise<PetResponse[]> {
    return getAllPets(page, limit, req)
  }
}

const addPet = async (
  name: string,
  age: number,
  color: string,
  bio: string,
  image: any,
  req: UserRequest
): Promise<PetResponse> => {
  if (!image) {
    throw { code: 400, message: 'No image file provided.' }
  }
  const petimage = image.filename

  const pet = new Pet({
    shelterId: (req.user as RequestUser)._id,
    name: name,
    age: age,
    color: color,
    bio: bio,
    image: petimage
  })

  await pet.save()

  return {
    name: pet.name,
    age: pet.age,
    color: pet.color,
    bio: pet.bio,
    image: pet.image
  }
}

const getAllPets = async (
  page = 1,
  limit = 3,
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
