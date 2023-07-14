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
    isWillingHomeInspection,
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
    isWillingHomeInspection: isWillingHomeInspection,
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
    status: application.status,
    submissionDate: application.createdAt,
    petName: pet.name,
    shelterName: shelter.name
  }
}

const getApplications = async (
  req: UserRequest
): Promise<ApplicationResponse[]> => {
  // Fetch applications made by the user
  const applications = await Application.find({
    applicantEmail: req.user?.email
  })

  // Create a new array to hold the response data
  const applicationsResponse: ApplicationResponse[] = []

  // Iterate over applications to fetch corresponding Pet and User data
  for (const application of applications) {
    const pet = await Pet.findOne({ microchipID: application.microchipID })
    const shelter = await User.findOne({
      role: Role.Shelter,
      _id: application.shelterID
    })

    // Construct the response object
    const applicationResponse: ApplicationResponse = {
      status: application.status,
      submissionDate: application.createdAt,
      petName: pet?.name || '',
      shelterName: shelter?.name || ''
    }

    // Add the response object to the response data array
    applicationsResponse.push(applicationResponse)
  }
  return applicationsResponse
}
