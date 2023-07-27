import { Pet } from '../models/Pet'
import {
  applicationExample,
  scheduleHomeVisitPayloadExample,
  updateApplicationExample
} from '../examples/application'
import Application, {
  AllApplicationsResponse,
  ApplicationPayload,
  ApplictionResponseForUser,
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
  Query,
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
  getPetAdoptionNotificationEmail,
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
  ): Promise<ApplictionResponseForUser> {
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
  ): Promise<ApplictionResponseForUser> {
    return getApplicationDetails(req)
  }

  /**
   * @summary Returns list of applications of a user
   *
   */
  @Security('bearerAuth')
  @Get('/applications')
  public async getApplications(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Request() req: UserRequest,
    @Query('searchQuery') searchQuery?: string,
    @Query('applicationStatusFilter') applicationStatusFilter?: string
  ): Promise<AllApplicationsResponse> {
    return getApplications(
      page,
      limit,
      req,
      searchQuery,
      applicationStatusFilter
    )
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
): Promise<ApplictionResponseForUser> => {
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
    application: {
      ...application.toObject(),
      id: application._id,
      status: application.status,
      submissionDate: application.createdAt.toISOString().split('T')[0],
      microchipID: application.microchipID,
      petImage: getImageURL(pet.images[0]),
      petName: pet.name,
      shelterName: shelter.name
    }
  }
}

const getApplicationDetails = async (
  req: UserRequest
): Promise<ApplictionResponseForUser> => {
  const application = await Application.findById(req.query.id)

  if (!application) throw { code: 404, message: 'Application not found' }

  const pet = await Pet.findOne({ microchipID: application.microchipID })
  const shelter = await User.findOne({
    role: Role.Shelter,
    _id: application.shelterID
  })

  if (!pet) throw { code: 404, message: 'Pet not found' }
  if (!shelter) throw { code: 404, message: 'Shelter not found' }

  const applicationResponse: ApplictionResponseForUser = {
    application: {
      ...application.toObject(),
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
  }
  console.log('applicationResponse', applicationResponse)
  return applicationResponse
}

const getApplications = async (
  page: number,
  limit: number,
  req: UserRequest,
  searchQuery?: string,
  applicationStatusFilter?: string
): Promise<AllApplicationsResponse> => {
  try {
    //console.log(applicationStatusFilter)
    console.log('searchQuery', searchQuery)
    const skip = (page - 1) * limit
    // Fetch applications with pagination
    let filter: { [key: string]: any } = {}

    if (req.user?.role === Role.User) {
      filter = { ...filter, applicantEmail: req.user?.email }
    } else if (req.user?.role === Role.Shelter) {
      filter = { ...filter, shelterID: req.user?._id }
    }

    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'users', // name of the collection
          localField: 'shelterID',
          foreignField: '_id',
          as: 'shelter'
        }
      },
      { $unwind: '$shelter' },
      // Add lookup stage for pets
      {
        $lookup: {
          from: 'pets',
          localField: 'microchipID',
          foreignField: 'microchipID',
          as: 'pet'
        }
      },
      { $unwind: '$pet' },
      // Add lookup stage for applicants
      {
        $lookup: {
          from: 'users',
          localField: 'applicantEmail',
          foreignField: 'email',
          as: 'applicant'
        }
      },
      { $unwind: '$applicant' }
    ]
    // First, get the total count of documents after filtering and all shelter names
    // Get all statuses without pagination or status filter
    const allApplications = await Application.aggregate(pipeline)
    // console.log(allApplications)
    const applicationStatuses = [
      ...new Set(allApplications.map((app) => app.status))
    ].sort()
    //console.log('statuses', applicationStatuses)

    // Add status and shelter name filters to pipeline if defined
    if (applicationStatusFilter) {
      pipeline.push({ $match: { status: applicationStatusFilter } })
    }

    // Add searchQuery filter to pipeline if defined
    if (searchQuery) {
      if (req.user?.role === Role.User) {
        pipeline.push({
          $match: {
            $or: [
              { 'pet.name': { $regex: searchQuery, $options: 'i' } },
              { 'shelter.name': { $regex: searchQuery, $options: 'i' } }
            ]
          }
        })
      } else if (req.user?.role === Role.Shelter) {
        pipeline.push({
          $match: {
            $or: [
              { 'pet.name': { $regex: searchQuery, $options: 'i' } },
              { 'applicant.name': { $regex: searchQuery, $options: 'i' } }
            ]
          }
        })
      }
    }

    // console.log('updated pipeline', pipeline)
    // First, get the total count of documents after filtering and all shelter names
    const countPipeline = [...pipeline, { $count: 'total' }]
    const count = await Application.aggregate(countPipeline)
    // console.log('count', count)
    const totalApplications = count[0]?.total || 0
    console.log('totalApplications', totalApplications)

    // Add pagination stages to the pipeline
    ;(pipeline as any).push({ $skip: skip }, { $limit: limit })
    const applications = await Application.aggregate(pipeline)
    // Fetch all pets and shelters at once
    const petIds = applications.map((a) => a.microchipID)
    const shelterIds = applications.map((a) => a.shelterID)

    const [pets, shelters] = await Promise.all([
      Pet.find({ microchipID: { $in: petIds } }),
      User.find({ role: Role.Shelter, _id: { $in: shelterIds } })
    ])

    const petsById = Object.fromEntries(
      pets.map((pet) => [pet.microchipID, pet])
    )
    const sheltersById = Object.fromEntries(
      shelters.map((shelter) => [shelter._id.toString(), shelter])
    )

    // Prepare all the Promises
    const applicationPromises = applications.map(async (application) => {
      const pet = petsById[application.microchipID]
      const shelter = sheltersById[application.shelterID]

      const applicantPromise = User.findOne({
        email: application.applicantEmail
      })
      const imageURLPromise = Promise.all(
        pet.images.map((image) => getImageURL(image))
      )

      const [applicant, imageURLs] = await Promise.all([
        applicantPromise,
        imageURLPromise
      ])

      if (!pet) throw { code: 404, message: 'Pet not found' }
      if (!shelter) throw { code: 404, message: 'Shelter not found' }
      if (!applicant) throw { code: 404, message: 'Applicant not found' }

      // Construct the response object
      const applicationResponse = {
        ...application,
        id: application._id.toString(),
        submissionDate: application.createdAt,
        petImage: imageURLs[0],
        petName: pet.name,
        shelterName: shelter.name,
        applicantName: applicant.name
      }
      return applicationResponse
    })

    // Run all the promises in parallel
    const applicationResponses = await Promise.all(applicationPromises)
    // Calculate the total number of pages
    const totalPages = Math.ceil(totalApplications / limit)

    // Return the final result
    return {
      applications: applicationResponses,
      totalPages,
      applicationStatuses
    }
  } catch (error: any) {
    throw { code: 500, message: 'Failed to fetch applications' }
  }
}

const scheduleHomeVisit = async (body: ScheduleHomeVisitPayload) => {
  const { id, visitDate } = body
  const application = await Application.findById(id)
  if (!application) throw { code: 404, message: 'Application not found' }

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

  const pet = await Pet.findOne({ microchipID: application.microchipID })
  if (!pet) throw { code: 404, message: 'Pet not found' }

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

  if (status === Status.Approved) {
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
    pet.isAdopted = true
    await pet.save()

    // Find all other applications for this pet
    const otherApplications = await Application.find({
      microchipID: pet.microchipID,
      _id: { $ne: application._id }
    })

    // Closing all other applications for this pet
    await Application.updateMany(
      { microchipID: pet.microchipID, _id: { $ne: application._id } },
      { $set: { status: Status.Closed } }
    )

    // Send email to all other applicants
    otherApplications.forEach(async (otherApp) => {
      const { subject, message } = getPetAdoptionNotificationEmail(
        otherApp._id.toString()
      )
      await sendEmail(otherApp.applicantEmail, subject, message)
    })
  }

  if (status === Status.Rejected) {
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
