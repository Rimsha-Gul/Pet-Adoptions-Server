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
  TimeSlotsResponse,
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
  getApplicantAdoptionConfirmationEmail,
  getApplicantHomeVisitScheduledEmail,
  getApplicantShelterVisitScheduledEmail,
  getApplicantAdoptionRejectionEmail,
  getHomeApprovalEmail,
  getHomeRejectionEmail,
  getHomeVisitRequestEmail,
  getPetAdoptionNotificationEmail,
  getShelterAdoptionConfirmationEmail,
  getShelterAdoptionRejectionEmail,
  getShelterHomeVisitScheduledEmail,
  getShelterShelterVisitScheduledEmail,
  getApplicantReactivationApprovalEmail,
  getApplicantReactivationDeclineEmail
} from '../data/emailMessages'
import { sendEmail } from '../middleware/sendEmail'
import { Visit, VisitType } from '../models/Visit'
import { canReview } from '../utils/canReview'
import { generateTimeSlots } from '../utils/generateTimeSlots'
import { Notification } from '../models/Notification'
import { emitUserNotification } from '../socket'
import moment from 'moment'

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
   * @summary Returns time slots available to shcedule visit on a particular day
   *
   */
  @Security('bearerAuth')
  @Get('/timeSlots')
  public async getTimeSlots(
    @Request() req: UserRequest
  ): Promise<TimeSlotsResponse> {
    return getTimeSlots(req)
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
  public async updateApplicationStatus(@Body() body: UpdateApplicationPayload) {
    return updateApplicationStatus(body)
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

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const canUserReview = await canReview(shelter.id.toString(), req.user!.email)

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
    },
    canReview: canUserReview
  }
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
    const skip = (page - 1) * limit
    // Fetch applications with pagination
    let filter: { [key: string]: any } = {}

    if (req.user?.role === Role.User) {
      filter = { ...filter, applicantEmail: req.user?.email }
    } else if (req.user?.role === Role.Shelter) {
      filter = { ...filter, shelterID: req.user?._id }
    }

    type AggregateStage =
      | { $match: { [key: string]: any } }
      | {
          $lookup: {
            from: string
            localField: string
            foreignField: string
            as: string
          }
        }
      | {
          $unwind:
            | string
            | { path: string; preserveNullAndEmptyArrays?: boolean }
        }
      | { $sort: { [key: string]: any } }

    const pipeline: AggregateStage[] = [
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
    const applicationStatuses = [
      ...new Set(allApplications.map((app) => app.status))
    ].sort()

    // Add status and shelter name filters to pipeline if defined
    if (applicationStatusFilter) {
      pipeline.push({ $match: { status: applicationStatusFilter } })
    }

    // Add searchQuery filter to pipeline if defined

    if (searchQuery) {
      let scoreStage
      if (req.user?.role === Role.User) {
        scoreStage = {
          $addFields: {
            score: {
              $add: [
                {
                  $cond: [
                    {
                      $regexMatch: {
                        input: '$pet.name',
                        regex: searchQuery,
                        options: 'i'
                      }
                    },
                    2,
                    0
                  ]
                }, // 2 points for pet name match
                {
                  $cond: [
                    {
                      $regexMatch: {
                        input: '$shelter.name',
                        regex: searchQuery,
                        options: 'i'
                      }
                    },
                    1,
                    0
                  ]
                } // 1 point for shelter name match
              ]
            }
          }
        }
      } else if (req.user?.role === Role.Shelter) {
        scoreStage = {
          $addFields: {
            score: {
              $add: [
                {
                  $cond: [
                    {
                      $regexMatch: {
                        input: '$pet.name',
                        regex: searchQuery,
                        options: 'i'
                      }
                    },
                    2,
                    0
                  ]
                }, // 2 points for pet name match
                {
                  $cond: [
                    {
                      $regexMatch: {
                        input: '$applicant.name',
                        regex: searchQuery,
                        options: 'i'
                      }
                    },
                    1,
                    0
                  ]
                } // 1 point for applicant name match
              ]
            }
          }
        }
      }

      if (scoreStage) {
        pipeline.push(scoreStage)
        pipeline.push({ $match: { score: { $gt: 0 } } }) // Only consider documents with a score greater than 0
      }
    }

    // First, get the total count of documents after filtering and all shelter names
    const countPipeline = [...pipeline, { $count: 'total' }]
    const count = await Application.aggregate(countPipeline)

    const totalApplications = count[0]?.total || 0

    // Sort the search results
    if (searchQuery) {
      pipeline.push({ $sort: { score: -1, name: 1 } })
    }

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

const getTimeSlots = async (req: UserRequest): Promise<TimeSlotsResponse> => {
  const { id, petID, visitDate, visitType } = req.query

  // Generate all possible time slots for the day
  const allTimeSlots = generateTimeSlots()

  // Convert the visitDate from the request into a Date object for comparison
  const startOfVisitDate = new Date(visitDate + 'T00:00:00Z')
  const startOfNextDate = new Date(
    startOfVisitDate.getTime() + 24 * 60 * 60 * 1000
  )

  // Define a query object
  const query: any = {
    visitType: visitType,
    visitDate: {
      $gte: startOfVisitDate.toISOString(),
      $lt: startOfNextDate.toISOString()
    },
    shelterID: id
  }

  // Conditionally add petID to the query if the visitType is 'Shelter'
  if (visitType === VisitType.Shelter) {
    query.petID = petID
  }

  const bookedVisits = await Visit.find(query)

  const timezoneOffsetHours = 5 // Offset between local time and UTC in hours

  const bookedTimeSlots = bookedVisits.map((visit) => {
    const visitDateObj = new Date(visit.visitDate)
    // Convert UTC time from database to local time
    visitDateObj.setHours(visitDateObj.getUTCHours() + timezoneOffsetHours)
    return (
      visitDateObj.getHours() +
      ':' +
      String(visitDateObj.getMinutes()).padStart(2, '0')
    )
  })

  // Filter the time slots that are still available
  const availableTimeSlots: string[] = allTimeSlots.filter(
    (slot) => !bookedTimeSlots.includes(slot)
  )
  return { availableTimeSlots: availableTimeSlots }
}

const scheduleHomeVisit = async (body: ScheduleHomeVisitPayload) => {
  const { id, visitDate } = body
  const application = await Application.findById(id)
  if (!application) throw { code: 404, message: 'Application not found' }

  const pet = await Pet.findOne({ microchipID: application.microchipID })
  if (!pet) throw { code: 404, message: 'Pet not found' }

  application.homeVisitDate = visitDate

  const shelter = await User.findOne({
    role: Role.Shelter,
    _id: application.shelterID
  })
  if (!shelter) throw { code: 404, message: 'Shelter not found' }

  const existingVisit = await Visit.findOne({
    applicationID: id,
    shelterID: application.shelterID,
    applicantEmail: application.applicantEmail,
    visitType: VisitType.Home
  })
  if (existingVisit) throw { code: 400, message: 'Visit already scheduled' }

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

  const visit = new Visit({
    applicationID: id,
    shelterID: application.shelterID,
    petID: application.microchipID,
    applicantEmail: application.applicantEmail,
    visitDate: visitDate,
    visitType: VisitType.Home
  })

  await visit.save()

  const notification = new Notification({
    userEmail: application.applicantEmail,
    applicationID: id,
    status: Status.UserVisitScheduled,
    petImage: getImageURL(pet.images[0]),
    actionUrl: `/view/application/${id}`,
    date: moment().utc().format('YYYY-MM-DDTHH:mm:ss[Z]')
  })

  const savedNotification = await notification.save()
  const notificationWithId = {
    ...savedNotification,
    id: savedNotification._id.toString()
  }
  emitUserNotification(application.applicantEmail, notificationWithId)

  return { code: 200, message: 'Home Visit has been scheduled' }
}

const scheduleShelterVisit = async (body: ScheduleHomeVisitPayload) => {
  const { id, visitDate } = body
  const application = await Application.findById(id)
  if (!application) throw { code: 404, message: 'Application not found' }

  const pet = await Pet.findOne({ microchipID: application.microchipID })
  if (!pet) throw { code: 404, message: 'Pet not found' }

  application.shelterVisitDate = visitDate

  const applicant = await User.findOne({
    role: Role.User,
    email: application.applicantEmail
  })
  if (!applicant) throw { code: 404, message: 'Applicant not found' }

  const shelter = await User.findOne({
    role: Role.Shelter,
    _id: application.shelterID
  })
  if (!shelter) throw { code: 404, message: 'Shelter not found' }

  const existingVisit = await Visit.findOne({
    applicationID: id,
    shelterID: application.shelterID,
    applicantEmail: application.applicantEmail,
    visitType: VisitType.Shelter
  })
  if (existingVisit) throw { code: 400, message: 'Visit already scheduled' }

  // Sending email to the applicant
  {
    const { subject, message } = getApplicantShelterVisitScheduledEmail(
      application._id.toString(),
      visitDate
    )
    await sendEmail(applicant.email, subject, message)
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

  const visit = new Visit({
    applicationID: id,
    shelterID: application.shelterID,
    petID: application.microchipID,
    applicantEmail: applicant.email,
    visitDate: visitDate,
    visitType: VisitType.Shelter
  })

  await visit.save()

  const notification = new Notification({
    userEmail: application.applicantEmail,
    applicationID: id,
    status: Status.UserVisitScheduled,
    petImage: getImageURL(pet.images[0]),
    actionUrl: `/view/application/${id}`,
    date: moment().utc().format('YYYY-MM-DDTHH:mm:ss[Z]')
  })

  const savedNotification = await notification.save()
  const notificationWithId = {
    ...savedNotification,
    id: savedNotification._id.toString()
  }
  emitUserNotification(application.applicantEmail, notificationWithId)

  return { code: 200, message: 'Shelter Visit has been scheduled' }
}

const updateApplicationStatus = async (body: UpdateApplicationPayload) => {
  try {
    const { id, status } = body
    let responseMessage = 'Application status updated successfully'

    const application = await Application.findById(id)
    if (!application) throw { code: 404, message: 'Application not found' }

    const shelter = await User.findOne({
      role: Role.Shelter,
      _id: application.shelterID
    })
    if (!shelter) throw { code: 404, message: 'Shelter not found' }

    const pet = await Pet.findOne({ microchipID: application.microchipID })
    if (!pet) throw { code: 404, message: 'Pet not found' }

    if (
      status !== Status.ReactivationRequestApproved &&
      status !== Status.ReactivationRequestDeclined
    )
      application.status = status

    // check the new status and trigger the appropriate email
    if (status === Status.HomeVisitRequested) {
      const { subject, message } = getHomeVisitRequestEmail(
        application._id.toString()
      )
      await sendEmail(application.applicantEmail, subject, message)
      application.homeVisitEmailSentDate = new Date().toISOString()

      // Set homeVisitScheduleExpiryDate to be one week from current date.
      const oneWeekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      oneWeekFromNow.setHours(23, 59, 59, 999)
      application.homeVisitScheduleExpiryDate = oneWeekFromNow.toISOString()

      responseMessage = 'Request sent successfully'
    }

    if (status === Status.HomeApproved) {
      const { subject, message } = getHomeApprovalEmail(
        application._id.toString(),
        new Date().toISOString()
      )
      await sendEmail(application.applicantEmail, subject, message)
      application.shelterVisitEmailSentDate = new Date().toISOString()

      // Set homeVisitScheduleExpiryDate to be one week from current date.
      const oneWeekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      oneWeekFromNow.setHours(23, 59, 59, 999)
      application.shelterVisitScheduleExpiryDate = oneWeekFromNow.toISOString()
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
        const { subject, message } = getApplicantAdoptionConfirmationEmail(
          application._id.toString(),
          new Date().toISOString()
        )
        await sendEmail(application.applicantEmail, subject, message)
      }

      {
        const { subject, message } = getShelterAdoptionConfirmationEmail(
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
        const { subject, message } = getApplicantAdoptionRejectionEmail(
          application._id.toString(),
          new Date().toISOString()
        )
        await sendEmail(application.applicantEmail, subject, message)
      }

      {
        const { subject, message } = getShelterAdoptionRejectionEmail(
          application._id.toString(),
          new Date().toISOString(),
          application.applicantEmail
        )
        await sendEmail(shelter.email, subject, message)
      }
    }

    if (status === Status.ReactivationRequestApproved) {
      const { subject, message } = getApplicantReactivationApprovalEmail(
        application._id.toString()
      )

      application.status = Status.HomeVisitRequested

      // Set the expiry date to 48 hours from now until midnight
      const twoDaysFromNow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 48 hours from now
      twoDaysFromNow.setHours(23, 59, 59, 999) // Set the time to that day's midnight

      application.homeVisitScheduleExpiryDate = twoDaysFromNow.toISOString()

      await sendEmail(application.applicantEmail, subject, message)
    }

    if (status === Status.ReactivationRequestDeclined) {
      const { subject, message } = getApplicantReactivationDeclineEmail(
        application._id.toString()
      )

      application.status = Status.Closed

      await sendEmail(application.applicantEmail, subject, message)
    }

    await application.save()

    const notification = new Notification({
      userEmail: application.applicantEmail,
      applicationID: id,
      status: status,
      petImage: getImageURL(pet.images[0]),
      actionUrl: `/view/application/${id}`,
      date: moment().utc().format('YYYY-MM-DDTHH:mm:ss[Z]')
    })

    const savedNotification = await notification.save()
    const notificationWithId = {
      ...savedNotification,
      id: savedNotification._id.toString()
    }
    emitUserNotification(application.applicantEmail, notificationWithId)

    return { code: 200, message: responseMessage }
  } catch (error) {
    console.log(error)
    return { code: 500, message: 'Error updating application status: ' }
  }
}
