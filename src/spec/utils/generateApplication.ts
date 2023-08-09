import Application, { ResidenceType } from '../../models/Application'

export interface Application {
  shelterID: string
  microchipID: string
  applicantEmail: string
  residenceType: ResidenceType
  hasRentPetPermission: boolean
  hasChildren: boolean
  childrenAges: string
  hasOtherPets: boolean
  otherPetsInfo: string
  petAloneTime: number
  hasPlayTimeParks: boolean
  petActivities: string
  handlePetIssues: string
  moveWithPet: string
  canAffordPetsNeeds: boolean
  canAffordPetsMediacal: boolean
  petTravelPlans: string
  petOutlivePlans: string
}

export const generateApplication = async (
  shelterID: string,
  microchipID: string,
  applicantEmail: string
) => {
  const application = new Application({
    shelterID: shelterID,
    microchipID: microchipID,
    applicantEmail: applicantEmail,
    residenceType: ResidenceType.Own,
    hasChildren: false,
    hasOtherPets: false,
    petAloneTime: 1,
    hasPlayTimeParks: true,
    petActivities: 'walking',
    handlePetIssues: 'buy new furniture',
    moveWithPet: 'move with him',
    canAffordPetsNeeds: true,
    canAffordPetsMediacal: true,
    petTravelPlans: 'travel wiith him',
    petOutlivePlans: 'friend will take care of him'
  })
  await application.save()
}

export const removeApplication = async () => {
  await Application.deleteMany({})
}
