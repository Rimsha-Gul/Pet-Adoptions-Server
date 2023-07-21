import { Pet } from '../models/Pet'
import {
  applicationExample,
  scheduleHomeVisitPayloadExample,
  updateApplicationExample
} from '../examples/application'
import Application, {
  ApplicationPayload,
  ApplicationResponse,
  ScheduleHomeVisitPayload,
  Status,
  UpdateApplicationPayload
} from '../models/Application'
import { UserRequest } from '../types/Request'
import {
  Body,
  Example,
  Get,
  Post,
  Put,
  Request,
  Route,
  Security,
  Tags
} from 'tsoa'
import { Role, User } from '../models/User'
import { getImageURL } from '../utils/getImageURL'
import {
  getApplicantHomeVisitScheduledEmail,
  getApplicantShelterVisitScheduledEmail,
  getHomeApprovalEmail,
  getHomeRejectionEmail,
  getHomeVisitRequestEmail,
  getShelterApprovalEmail,
  getShelterHomeVisitScheduledEmail,
  getShelterRejectionEmail,
  getShelterShelterVisitScheduledEmail,
  getUserApprovalToShelterEmail,
  getUserRejectionToShelterEmail
} from '../data/emailMessages'
import { sendEmail } from '../middleware/sendEmail'
import { validateStatusChange } from '../utils/validateStatusChange'

@Route('application')
@Tags('Application')
export class ApplicationController {
  /**
   * @summary Accepts application info and creates application if all fields are valid
   *
   */
  @Example<ApplicationPayload>(applicationExample)
  @Security('bearerAuth')
  @Post('/')
  public async applyForAPet(
    @Body() body: ApplicationPayload,
    @Request() req: UserRequest
  ): Promise<ApplicationResponse> {
    return applyForAPet(body, req)
  }

  /**
   * @summary Returns an application's details given id
   *
   */
  @Security('bearerAuth')
  @Get('/')
  public async getApplicationDetails(
    @Request() req: UserRequest
  ): Promise<ApplicationResponse> {
    return getApplicationDetails(req)
  }

  /**
   * @summary Returns list of applications of a user
   *
   */
  @Security('bearerAuth')
  @Get('/applications')
  public async getApplications(
    @Request() req: UserRequest
  ): Promise<ApplicationResponse[]> {
    return getApplications(req)
  }

  /**
   * @summary Accepts application id and date for home visit and sends email to applicant and shelter
   *
   */
  @Example<ScheduleHomeVisitPayload>(scheduleHomeVisitPayloadExample)
  @Security('bearerAuth')
  @Post('/scheduleHomeVisit')
  public async scheduleHomeVisit(@Body() body: ScheduleHomeVisitPayload) {
    return scheduleHomeVisit(body)
  }

  /**
   * @summary Accepts application id and date for shelter visit and sends email to applicant and shelter
   *
   */
  @Example<ScheduleHomeVisitPayload>(scheduleHomeVisitPayloadExample)
  @Security('bearerAuth')
  @Post('/scheduleShelterVisit')
  public async scheduleShelterVisit(@Body() body: ScheduleHomeVisitPayload) {
    return scheduleShelterVisit(body)
  }

  /**
   * @summary Updates an application's status
   *
   */
  @Example<UpdateApplicationPayload>(updateApplicationExample)
  @Security('bearerAuth')
  @Put('/updateStatus')
  public async updateApplicationStatus(
    @Body() body: UpdateApplicationPayload,
    @Request() req: UserRequest
  ) {
    return updateApplicationStatus(body, req)
  }
}

const applyForAPet = async (
  body: ApplicationPayload,
  req: UserRequest
): Promise<ApplicationResponse> => {
  const {
    shelterID,
    microchipID,
    residenceType,
    hasRentPetPermission,
    hasChildren,
    childrenAges,
    hasOtherPets,
    otherPetsInfo,
    petAloneTime,
    hasPlayTimeParks,
    petActivities,
    handlePetIssues,
    moveWithPet,
    canAffordPetsNeeds,
    canAffordPetsMediacal,
    petTravelPlans,
    petOutlivePlans
  } = body

  const pet = await Pet.findOne({ microchipID: microchipID })
  if (!pet) throw { code: 404, message: 'Pet not found' }

  const shelter = await User.findOne({
    role: Role.Shelter,
    _id: shelterID
  })
  if (!shelter) throw { code: 404, message: 'Shelter not found' }

  // Check if application with same applicantEmail and microchipID already exists
  const existingApplication = await Application.findOne({
    applicantEmail: req.user?.email,
    microchipID: microchipID
  })

  if (existingApplication)
    throw { code: 400, message: 'You have already applied for this pet.' }

  pet.hasAdoptionRequest = true
  await pet.save()

  const application = new Application({
    shelterID: shelterID,
    microchipID: microchipID,
    applicantEmail: req.user?.email,
    residenceType: residenceType,
    hasRentPetPermission: hasRentPetPermission,
    hasChildren: hasChildren,
    childrenAges: childrenAges,
    hasOtherPets: hasOtherPets,
    otherPetsInfo: otherPetsInfo,
    petAloneTime: petAloneTime,
    hasPlayTimeParks: hasPlayTimeParks,
    petActivities: petActivities,
    handlePetIssues: handlePetIssues,
    moveWithPet: moveWithPet,
    canAffordPetsNeeds: canAffordPetsNeeds,
    canAffordPetsMediacal: canAffordPetsMediacal,
    petTravelPlans: petTravelPlans,
    petOutlivePlans: petOutlivePlans,
    status: Status.UnderReview
  })

  await application.save()
  return {
    id: application._id,
    status: application.status,
    submissionDate: application.createdAt.toISOString().split('T')[0],
    microchipID: application.microchipID,
    petImage: getImageURL(pet.images[0]),
    petName: pet.name,
    shelterName: shelter.name
  }
}

const getApplicationDetails = async (
  req: UserRequest
): Promise<ApplicationResponse> => {
  const application = await Application.findById(req.query.id)

  if (!application) throw { code: 404, message: 'Application not found' }

  const pet = await Pet.findOne({ microchipID: application.microchipID })
  const shelter = await User.findOne({
    role: Role.Shelter,
    _id: application.shelterID
  })

  if (!pet) throw { code: 404, message: 'Pet not found' }
  if (!shelter) throw { code: 404, message: 'Shelter not found' }

  const applicationResponse: ApplicationResponse = {
    id: application._id.toString(),
    status: application.status,
    submissionDate: application.createdAt.toISOString().split('T')[0],
    microchipID: application.microchipID,
    petImage: getImageURL(pet.images[0]),
    petName: pet.name,
    shelterName: shelter.name,
    homeVisitDate: application.homeVisitDate,
    shelterVisitDate: application.shelterVisitDate,
    homeVisitEmailSentDate: application.homeVisitEmailSentDate,
    shelterVisitEmailSentDate: application.shelterVisitEmailSentDate
  }
  console.log('applicationResponse', applicationResponse)
  return applicationResponse
}

const getApplications = async (
  req: UserRequest
): Promise<ApplicationResponse[]> => {
  // Fetch applications made by the user
  let applications
  if (req.user?.role === Role.User) {
    applications = await Application.find({
      applicantEmail: req.user?.email
    })
  } else if (req.user?.role === Role.Shelter) {
    applications = await Application.find({
      shelterID: req.user?._id
    })
  }

  // Create a new array to hold the response data
  const applicationsResponse: ApplicationResponse[] = []
  console.log(applications)

  if (!applications) return applicationsResponse

  // Iterate over applications to fetch corresponding Pet and User data
  for (const application of applications) {
    const pet = await Pet.findOne({ microchipID: application.microchipID })
    const shelter = await User.findOne({
      role: Role.Shelter,
      _id: application.shelterID
    })
    const applicant = await User.findOne({ email: application.applicantEmail })

    if (!pet) throw { code: 404, message: 'Pet not found' }
    if (!shelter) throw { code: 404, message: 'Shelter not found' }
    if (!applicant) throw { code: 404, message: 'Applicant not found' }

    // Construct the response object
    const applicationResponse: ApplicationResponse = {
      id: application._id.toString(),
      status: application.status,
      submissionDate: application.createdAt,
      microchipID: application.microchipID,
      petImage: getImageURL(pet.images[0]),
      petName: pet.name,
      shelterName: shelter.name,
      applicantName: applicant.name,
      homeVisitDate: application.homeVisitDate,
      shelterVisitDate: application.shelterVisitDate,
      homeVisitEmailSentDate: application.homeVisitEmailSentDate,
      shelterVisitEmailSentDate: application.shelterVisitEmailSentDate
    }

    // Add the response object to the response data array
    applicationsResponse.push(applicationResponse)
  }
  return applicationsResponse
}

const scheduleHomeVisit = async (body: ScheduleHomeVisitPayload) => {
  const { id, visitDate } = body
  const application = await Application.findById(id)
  if (!application) throw { code: 404, message: 'Application not found' }

  // Convert visitDate to Date object and adjust timezone
  // const visitDateObj = new Date(visitDate)
  // visitDateObj.setMinutes(
  //   visitDateObj.getMinutes() - visitDateObj.getTimezoneOffset()
  // )

  application.homeVisitDate = visitDate

  const shelter = await User.findOne({
    role: Role.Shelter,
    _id: application.shelterID
  })
  if (!shelter) throw { code: 404, message: 'Shelter not found' }

  // Sending email to the applicant
  {
    const { subject, message } = getApplicantHomeVisitScheduledEmail(
      application._id.toString(),
      visitDate
    )
    await sendEmail(application.applicantEmail, subject, message)
  }

  // Sending email to the shelter
  {
    const { subject, message } = getShelterHomeVisitScheduledEmail(
      application._id.toString(),
      visitDate
    )
    await sendEmail(shelter.email, subject, message)
  }

  application.status = Status.HomeVisitScheduled
  await application.save()

  return { code: 200, message: 'Home Visit has been scheduled' }
}

const scheduleShelterVisit = async (body: ScheduleHomeVisitPayload) => {
  const { id, visitDate } = body
  const application = await Application.findById(id)
  if (!application) throw { code: 404, message: 'Application not found' }

  application.shelterVisitDate = visitDate

  const shelter = await User.findOne({
    role: Role.Shelter,
    _id: application.shelterID
  })
  if (!shelter) throw { code: 404, message: 'Shelter not found' }

  // Sending email to the applicant
  {
    const { subject, message } = getApplicantShelterVisitScheduledEmail(
      application._id.toString(),
      visitDate
    )
    await sendEmail(application.applicantEmail, subject, message)
  }

  // Sending email to the shelter
  {
    const { subject, message } = getShelterShelterVisitScheduledEmail(
      application._id.toString(),
      visitDate
    )
    await sendEmail(shelter.email, subject, message)
  }

  application.status = Status.UserVisitScheduled
  await application.save()

  return { code: 200, message: 'Shelter Visit has been scheduled' }
}

const updateApplicationStatus = async (
  body: UpdateApplicationPayload,
  req: UserRequest
) => {
  const { id, status } = body

  const role = req.user?.role || Role.User
  // Check if the role has permission to make this status change.
  if (!validateStatusChange(role, status)) {
    throw { code: 403, message: 'Forbidden status change' }
  }

  const application = await Application.findById(id)
  if (!application) throw { code: 404, message: 'Application not found' }

  const shelter = await User.findOne({
    role: Role.Shelter,
    _id: application.shelterID
  })
  if (!shelter) throw { code: 404, message: 'Shelter not found' }

  application.status = status

  // check the new status and trigger the appropriate email
  if (status === Status.HomeVisitRequested) {
    const { subject, message } = getHomeVisitRequestEmail(
      application._id.toString()
    )
    await sendEmail(application.applicantEmail, subject, message)
    application.homeVisitEmailSentDate = new Date().toISOString()
    await application.save()
    return { code: 200, message: 'Request sent successfully' }
  }

  if (status === Status.HomeApproved) {
    const { subject, message } = getHomeApprovalEmail(
      application._id.toString(),
      new Date().toISOString()
    )
    await sendEmail(application.applicantEmail, subject, message)
    application.shelterVisitEmailSentDate = new Date().toISOString()
  }

  if (status === Status.HomeRejected) {
    const { subject, message } = getHomeRejectionEmail(
      application._id.toString(),
      new Date().toISOString()
    )
    await sendEmail(application.applicantEmail, subject, message)
  }

  if (status === Status.UserApprovedShelter) {
    {
      const { subject, message } = getShelterApprovalEmail(
        application._id.toString(),
        new Date().toISOString()
      )
      await sendEmail(application.applicantEmail, subject, message)
    }

    {
      const { subject, message } = getUserApprovalToShelterEmail(
        application._id.toString(),
        new Date().toISOString(),
        application.applicantEmail
      )
      await sendEmail(shelter.email, subject, message)
    }
  }

  if (status === Status.UserRejectedShelter) {
    {
      const { subject, message } = getShelterRejectionEmail(
        application._id.toString(),
        new Date().toISOString()
      )
      await sendEmail(application.applicantEmail, subject, message)
    }

    {
      const { subject, message } = getUserRejectionToShelterEmail(
        application._id.toString(),
        new Date().toISOString(),
        application.applicantEmail
      )
      await sendEmail(shelter.email, subject, message)
    }
  }
  await application.save()

  return { code: 200, message: 'Application status updated successfully' }
}
