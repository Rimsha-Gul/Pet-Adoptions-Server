import Application, {
  ApplictionResponseForShelter
} from '../models/Application'
import { UserRequest } from '../types/Request'
import { Body, Example, Get, Post, Request, Route, Security, Tags } from 'tsoa'
import { Pet } from '../models/Pet'
import {
  EmailPayload,
  Role,
  ShelterProfileResponse,
  User,
  VerifyInvitationResponse
} from '../models/User'
import { getImageURL } from '../utils/getImageURL'
import { emailPayloadExample } from '../examples/auth'
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
  public async inviteShelter(@Body() body: EmailPayload) {
    return inviteShelter(body)
  }

  /**
   * @summary Verifies the invitation token for shelter
   *
   */
  @Get('/verifyInvitationToken')
  @Example<VerifyInvitationResponse>(verifyInvitationResponseExample)
  public async verifyInvitationToken(
    @Request() req: UserRequest
  ): Promise<VerifyInvitationResponse> {
    return verifyInvitationToken(req)
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
  req: UserRequest
): Promise<VerifyInvitationResponse> => {
  const { invitationToken } = req.query

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
