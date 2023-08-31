import { Application, Status } from '../models/Application'
import { reactivationRequestExample } from '../examples/reactivationRequest'
import {
  ReactivationRequest,
  ReactivationRequestPayload,
  ReactivationRequestResponse
} from '../models/ReactivationRequest'
import { Body, Example, Get, Post, Request, Route, Security, Tags } from 'tsoa'
import { Role, User } from '../models/User'
import { getReactivationRequestEmail } from '../data/emailMessages'
import { sendEmail } from '../middleware/sendEmail'
import { UserRequest } from '../types/Request'

@Route('reactivationRequest')
@Tags('ReactivationRequest')
export class ReactivationRequestController {
  /**
   * @summary Accepts reactivation request and sends email to shelter
   *
   */
  @Example<ReactivationRequestPayload>(reactivationRequestExample)
  @Security('bearerAuth')
  @Post('/')
  public async requestReactivation(@Body() body: ReactivationRequestPayload) {
    return requestReactivation(body)
  }

  /**
   * @summary Returns the reactivation request associated with given application ID
   *
   */
  @Security('bearerAuth')
  @Get('/')
  public async getReactivationRequest(
    @Request() req: UserRequest
  ): Promise<ReactivationRequestResponse> {
    return getReactivationRequest(req)
  }
}

const requestReactivation = async (body: ReactivationRequestPayload) => {
  const { applicationID, reasonNotScheduled, reasonToReactivate } = body

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
  req: UserRequest
): Promise<ReactivationRequestResponse> => {
  console.log(req.query.id)
  const application = await Application.findById(req.query.id)
  if (!application) throw { code: 404, message: 'Application not found' }
  const request = await ReactivationRequest.findOne({
    applicationID: req.query.id
  })

  if (!request) throw { code: 404, message: 'Reactivation Request not found' }

  return {
    reasonNotScheduled: request.reasonNotScheduled,
    reasonToReactivate: request.reasonToReactivate
  }
}
