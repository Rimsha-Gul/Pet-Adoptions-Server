import { Application, Status } from '../models/Application'
import { reactivationRequestExample } from '../examples/reactivationRequest'
import {
  ReactivationRequest,
  ReactivationRequestPayload
} from '../models/ReactivationRequest'
import { Body, Example, Get, Path, Post, Route, Security, Tags } from 'tsoa'
import { Role, User } from '../models/User'
import { getReactivationRequestEmail } from '../data/emailMessages'
import { sendEmail } from '../middleware/sendEmail'

@Route('reactivationRequest')
@Tags('ReactivationRequest')
export class ReactivationRequestController {
  /**
   * @summary Accepts reactivation request and sends email to shelter
   * @param applicationID ID of the application
   * @example applicationID "64b14bd7ba2fba2af4b5338d"
   */
  @Security('bearerAuth')
  @Post('/:applicationID')
  public async requestReactivation(
    @Path() applicationID: string,
    @Body() body: ReactivationRequestPayload
  ) {
    return requestReactivation(applicationID, body)
  }

  /**
   * @summary Returns the reactivation request associated with given application ID
   * @param applicationID ID of the application
   * @example applicationID "64b14bd7ba2fba2af4b5338d"
   */
  @Example<ReactivationRequestPayload>(reactivationRequestExample)
  @Security('bearerAuth')
  @Get('/:applicationID')
  public async getReactivationRequest(
    @Path() applicationID: string
  ): Promise<ReactivationRequestPayload> {
    return getReactivationRequest(applicationID)
  }
}

const requestReactivation = async (
  applicationID: string,
  body: ReactivationRequestPayload
) => {
  const { reasonNotScheduled, reasonToReactivate } = body

  // Find the application by ID
  const application = await Application.findById(applicationID)

  if (!application) throw { code: 404, message: 'Application not found' }

  const shelter = await User.findOne({
    role: Role.Shelter,
    _id: application.shelterID
  })
  if (!shelter) throw { code: 404, message: 'Shelter not found' }

  const existingRequest = await ReactivationRequest.findOne({
    applicationID: applicationID
  })

  if (existingRequest)
    throw { code: 409, message: 'Reactivation Request already exists' }

  // Create a new reactivation request record
  const reactivationRequest = new ReactivationRequest({
    applicationID,
    reasonNotScheduled,
    reasonToReactivate
  })

  await reactivationRequest.save()

  // Update the application status
  application.status = Status.ReactivationRequested
  await application.save()

  const { subject, message } = getReactivationRequestEmail(
    applicationID,
    shelter.name
  )

  await sendEmail(shelter.email, subject, message)

  return { code: 200, message: 'Reactivation Request submitted successfully' }
}

const getReactivationRequest = async (
  applicationID: string
): Promise<ReactivationRequestPayload> => {
  const application = await Application.findById(applicationID)
  if (!application) throw { code: 404, message: 'Application not found' }
  const request = await ReactivationRequest.findOne({
    applicationID: applicationID
  })

  if (!request) throw { code: 404, message: 'Reactivation Request not found' }

  return {
    reasonNotScheduled: request.reasonNotScheduled,
    reasonToReactivate: request.reasonToReactivate
  }
}
