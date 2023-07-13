import { applicationExample } from '../examples/application'
import Application, { ApplicationPayload } from '../models/Application'
import { UserRequest } from '../types/Request'
import { Body, Example, Post, Request, Route, Security, Tags } from 'tsoa'

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
  ) {
    return applyForAPet(body, req)
  }
}

const applyForAPet = async (body: ApplicationPayload, req: UserRequest) => {
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

  // Check if application with same applicantEmail and microchipID already exists
  const existingApplication = await Application.findOne({
    applicantEmail: req.user?.email,
    microchipID: microchipID
  })

  if (existingApplication) {
    // If it does, return a message to inform the user
    return { code: 400, message: 'You have already applied for this pet.' }
  }

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
    petOutlivePlans: petOutlivePlans
  })

  await application.save()
  return { code: 200, message: 'Application submitted successfully' }
}
