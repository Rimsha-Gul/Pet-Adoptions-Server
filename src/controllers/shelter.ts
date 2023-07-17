import Application, {
  ApplictionResponseForShelter
} from '../models/Application'
import { UserRequest } from '../types/Request'
import { Get, Request, Route, Security, Tags } from 'tsoa'
import { Pet } from '../models/Pet'
import { User } from '../models/User'
import { getImageURL } from '../utils/getImageURL'

@Route('shelter')
@Tags('Shelter')
export class ShelterController {
  /**
   * @summary Returns an application's details given id
   *
   */
  @Security('bearerAuth')
  @Get('/application')
  public async getApplicationDetails(
    @Request() req: UserRequest
  ): Promise<ApplictionResponseForShelter> {
    return getApplicationDetails(req)
  }
}

const getApplicationDetails = async (
  req: UserRequest
): Promise<ApplictionResponseForShelter> => {
  const application = await Application.findById(req.query.id)
  if (!application) throw { code: 404, message: 'Application not found' }

  const applicant = await User.findOne({
    email: application.applicantEmail
  })
  const pet = await Pet.findOne({ microchipID: application.microchipID })

  if (!applicant) throw { code: 404, message: 'Applicant not found' }
  if (!pet) throw { code: 404, message: 'Pet not found' }

  const applicationResponse: ApplictionResponseForShelter = {
    application: {
      ...application.toObject(),
      id: application._id.toString(),
      applicantName: applicant.name,
      submissionDate: application.createdAt,
      petImage: getImageURL(pet.images[0]),
      petName: pet.name
    }
  }
  return applicationResponse
}
