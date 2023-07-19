import { Pet } from '../models/Pet'
import { applicationExample } from '../examples/application'
import Application, {
  ApplicationPayload,
  ApplicationResponse,
  Status
} from '../models/Application'
import { UserRequest } from '../types/Request'
import { Body, Example, Get, Post, Request, Route, Security, Tags } from 'tsoa'
import { Role, User } from '../models/User'
import { getImageURL } from '../utils/getImageURL'

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
    shelterName: shelter.name
  }
  console.log(applicationResponse)
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
      applicantName: applicant.name
    }

    // Add the response object to the response data array
    applicationsResponse.push(applicationResponse)
  }
  return applicationsResponse
}
