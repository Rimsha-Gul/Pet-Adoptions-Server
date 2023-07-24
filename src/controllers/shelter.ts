import Application, {
  ApplictionResponseForShelter
} from '../models/Application'
import { UserRequest } from '../types/Request'
import { Body, Example, Get, Post, Request, Route, Security, Tags } from 'tsoa'
import { Pet } from '../models/Pet'
import { EmailPayload, User } from '../models/User'
import { getImageURL } from '../utils/getImageURL'
import { emailPayloadExample } from '../examples/auth'
import { generateInvitationToken } from '../utils/generateInvitationToken'
import Invitation, { InvitationStatus } from '../models/Invitation'
import { getShelterInvitationEmail } from '../data/emailMessages'
import { sendEmail } from '../middleware/sendEmail'

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

  /**
   * @summary Returns an application's details given id
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
