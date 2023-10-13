import Application, {
  ApplictionResponseForShelter
} from '../models/Application'
import { UserRequest } from '../types/Request'
import {
  Body,
  Example,
  Get,
  Path,
  Post,
  Query,
  Request,
  Route,
  Security,
  Tags
} from 'tsoa'
import { Pet } from '../models/Pet'
import {
  EmailPayload,
  Role,
  ShelterProfileResponse,
  ShelterResponse,
  User,
  VerifyInvitationResponse
} from '../models/User'
import { getImageURL } from '../utils/getImageURL'
import { emailPayloadExample, shelterResponseExample } from '../examples/auth'
import { generateInvitationToken } from '../utils/generateInvitationToken'
import Invitation, { InvitationStatus } from '../models/Invitation'
import { getShelterInvitationEmail } from '../data/emailMessages'
import { sendEmail } from '../middleware/sendEmail'
import {
  shelterProfileResponseExample,
  verifyInvitationResponseExample
} from '../examples/shelter'
import { canReview } from '../utils/canReview'
import jwt from 'jsonwebtoken'

@Route('shelter')
@Tags('Shelter')
export class ShelterController {
  /**
   * @summary Returns a shelter's details given id
   * @param shelterID ID of the shelter
   * @example shelterID "6475e9630044288a2b4880b5"
   */
  @Security('bearerAuth')
  @Get('/:shelterID')
  @Example<ShelterProfileResponse>(shelterProfileResponseExample)
  public async getShelter(
    @Request() req: UserRequest,
    @Path() shelterID: string
  ): Promise<ShelterProfileResponse> {
    return getShelter(req, shelterID)
  }

  /**
   * @summary Returns ids and names of all shelters
   *
   */
  @Example<ShelterResponse>(shelterResponseExample)
  @Security('bearerAuth')
  @Get('/')
  public async getShelters(
    @Request() req: UserRequest
  ): Promise<ShelterResponse[]> {
    return getShelters(req)
  }

  /**
   * @summary Returns an application's details given id
   * @param applicationID ID of the application
   * @example applicationID "64b14bd7ba2fba2af4b5338d"
   */
  @Security('bearerAuth')
  @Get('/applications/:applicationID')
  public async getApplicationDetails(
    @Request() req: UserRequest,
    @Path() applicationID: string
  ): Promise<ApplictionResponseForShelter> {
    return getApplicationDetails(req, applicationID)
  }

  /**
   * @summary Sends invite to shelter to sign up
   *
   */
  @Security('bearerAuth')
  @Post('/invitations')
  @Example<EmailPayload>(emailPayloadExample)
  public async inviteShelter(@Body() body: EmailPayload) {
    return inviteShelter(body)
  }

  /**
   * @summary Verifies the invitation token for shelter
   *
   */
  @Get('/invitations/token/verification')
  @Example<VerifyInvitationResponse>(verifyInvitationResponseExample)
  public async verifyInvitationToken(
    @Query() invitationToken: string
  ): Promise<VerifyInvitationResponse> {
    return verifyInvitationToken(invitationToken)
  }
}

const getShelter = async (
  req: UserRequest,
  shelterID: string
): Promise<ShelterProfileResponse> => {
  const shelter = await User.findById(shelterID)
  if (!shelter) throw { code: 404, message: 'Shelter not found' }

  let profilePhotoUrl
  if (shelter.profilePhoto.length > 0) {
    profilePhotoUrl = getImageURL(shelter.profilePhoto[0])
  }

  const canUserReview = await canReview(
    shelter.id.toString(),
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    req.user!.email
  )

  const shelterResponse = {
    profilePhoto: profilePhotoUrl,
    name: shelter.name,
    email: shelter.email,
    address: shelter.address,
    bio: shelter.bio,
    rating: shelter.rating,
    numberOfReviews: shelter.numberOfReviews,
    canReview: canUserReview
  }

  return shelterResponse
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getShelters = async (_req: UserRequest): Promise<ShelterResponse[]> => {
  const shelters = await User.find({ role: 'SHELTER' }, '_id name')
  const shelterResponses: ShelterResponse[] = shelters.map((shelter) => ({
    id: shelter._id.toString(),
    name: shelter.name
  }))
  return shelterResponses
}

const getApplicationDetails = async (
  req: UserRequest,
  applicationID: string
): Promise<ApplictionResponseForShelter> => {
  const application = await Application.findOne({
    _id: applicationID,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    shelterID: req.user!._id
  })
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

const inviteShelter = async (body: EmailPayload) => {
  const { email } = body
  const existingUser = await User.findOne({ email })
  if (existingUser && existingUser?.role === Role.Shelter)
    throw { code: 409, message: 'Shelter already  exists' }
  if (existingUser && existingUser?.role === Role.User)
    throw { code: 409, message: 'User already  exists, which is not a shelter' }
  const existingInvitation = await Invitation.findOne({ shelterEmail: email })
  if (existingInvitation) throw { code: 409, message: 'Invite already sent' }

  const invitationToken = generateInvitationToken(email, Role.Shelter)

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

const verifyInvitationToken = async (
  invitationToken: string
): Promise<VerifyInvitationResponse> => {
  try {
    // decode and verify the token synchronously
    const decoded: any = jwt.verify(
      invitationToken as string,
      process.env.INVITATION_TOKEN_SECRET || ''
    )

    const { email, role } = decoded

    // Check if a user with the given email already exists
    const existingUser = await User.findOne({ email })
    if (
      existingUser &&
      existingUser.role === Role.Shelter &&
      existingUser.isVerified === true
    )
      throw { code: 409, message: 'Shelter already  exists' }
    if (
      existingUser &&
      existingUser.role === Role.Shelter &&
      existingUser.isVerified === false
    )
      throw {
        code: 409,
        email: email,
        message: 'Shelter already  exists, but is not verified'
      }
    if (existingUser && existingUser.role === Role.User)
      throw {
        code: 409,
        message: 'User already  exists, which is not a shelter'
      }

    // Verify the invitation status
    const invitation = await Invitation.findOne({
      invitationToken: invitationToken
    })
    if (!invitation || invitation.status !== InvitationStatus.Pending) {
      throw { code: 400, message: 'Invalid or expired invitation' }
    }

    return { email, role }
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw { code: 400, message: 'Expired invitation token' }
    }
    if (err.name === 'JsonWebTokenError') {
      throw { code: 400, message: 'Invalid invitation token' }
    }
    throw err
  }
}
