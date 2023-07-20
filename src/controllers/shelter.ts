import Application, {
  ApplictionResponseForShelter,
  Status,
  UpdateApplicationPayload
} from '../models/Application'
import { UserRequest } from '../types/Request'
import { Body, Example, Get, Put, Request, Route, Security, Tags } from 'tsoa'
import { Pet } from '../models/Pet'
import { User } from '../models/User'
import { getImageURL } from '../utils/getImageURL'
import { updateApplicationExample } from '../examples/application'
import {
  getHomeApprovalEmail,
  getHomeRejectionEmail,
  getHomeVisitRequestEmail
} from '../data/emailMessages'
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
   * @summary Updates an application's status
   *
   */
  @Example<UpdateApplicationPayload>(updateApplicationExample)
  @Security('bearerAuth')
  @Put('/updateApplicationStatus')
  public async updateApplicationStatus(@Body() body: UpdateApplicationPayload) {
    return updateApplicationStatus(body)
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

const updateApplicationStatus = async (body: UpdateApplicationPayload) => {
  const { id, status } = body
  const application = await Application.findById(id)
  if (!application) throw { code: 404, message: 'Application not found' }

  application.status = status
  await application.save()

  // check if the new status is 'Home Visit Requested' and trigger the email
  if (status === Status.HomeVisitRequested) {
    const { subject, message } = getHomeVisitRequestEmail(
      application._id.toString()
    )
    await sendEmail(application.applicantEmail, subject, message)
    return { code: 200, message: 'Request sent successfully' }
  }

  if (status === Status.HomeApproved) {
    const { subject, message } = getHomeApprovalEmail(
      application._id.toString(),
      application.homeVisitDate
    )
    await sendEmail(application.applicantEmail, subject, message)
  }

  if (status === Status.HomeRejected) {
    const { subject, message } = getHomeRejectionEmail(
      application._id.toString(),
      application.homeVisitDate
    )
    await sendEmail(application.applicantEmail, subject, message)
  }

  return { code: 200, message: 'Application status updated successfully' }
}
