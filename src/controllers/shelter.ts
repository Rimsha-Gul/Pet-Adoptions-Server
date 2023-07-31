import Application, {
  ApplictionResponseForShelter
} from '../models/Application'
import { UserRequest } from '../types/Request'
import { Body, Example, Get, Post, Request, Route, Security, Tags } from 'tsoa'
import { Pet } from '../models/Pet'
import { EmailPayload, ShelterProfileResponse, User } from '../models/User'
import { getImageURL } from '../utils/getImageURL'
import { emailPayloadExample } from '../examples/auth'
import { generateInvitationToken } from '../utils/generateInvitationToken'
import Invitation, { InvitationStatus } from '../models/Invitation'
import { getShelterInvitationEmail } from '../data/emailMessages'
import { sendEmail } from '../middleware/sendEmail'
import { shelterProfileResponseExample } from '../examples/shelter'
import Visit from '../models/Visits'

@Route('shelter')
@Tags('Shelter')
export class ShelterController {
  /**
   * @summary Returns a shelter's details given id
   *
   */
  @Security('bearerAuth')
  @Get('/')
  @Example<ShelterProfileResponse>(shelterProfileResponseExample)
  public async getShelter(
    @Request() req: UserRequest
  ): Promise<ShelterProfileResponse> {
    return getShelter(req)
  }

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

  /**
   * @summary Sends invite to shelter to sign up
   *
   */
  @Security('bearerAuth')
  @Post('/invite')
  @Example<EmailPayload>(emailPayloadExample)
  public async inviteShelter(
    @Body() body: EmailPayload,
    @Request() req: UserRequest
  ) {
    return inviteShelter(body, req)
  }
}

const getShelter = async (
  req: UserRequest
): Promise<ShelterProfileResponse> => {
  const shelter = await User.findById(req.query.id)
  if (!shelter) throw { code: 404, message: 'Shelter not found' }

  let profilePhotoUrl
  if (shelter.profilePhoto.length > 0) {
    profilePhotoUrl = getImageURL(shelter.profilePhoto[0])
  }

  const canUserReview = Boolean(
    Visit.findOne({
      shelterID: shelter.id.toString(),
      applicantEmail: req.user?.email
    })
  )

  const shelterResponse = {
    profilePhoto: profilePhotoUrl,
    name: shelter.name,
    email: shelter.email,
    address: shelter.address,
    bio: shelter.bio,
    canReview: canUserReview
  }

  return shelterResponse
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

const inviteShelter = async (body: EmailPayload, req: UserRequest) => {
  const { email } = body
  const existingShelter = await User.findOne({ email })
  if (existingShelter) throw { code: 409, message: 'Shelter already  exists' }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const invitationToken = generateInvitationToken(email, req.user!.role)

  const { subject, message } = getShelterInvitationEmail(invitationToken)

  const invitation = new Invitation({
    shelterEmail: email,
    invitationToken: invitationToken,
    status: InvitationStatus.Pending
  })
  await sendEmail(email, subject, message)

  await invitation.save()

  return { code: 200, message: 'Invitation sent successfully' }
}
