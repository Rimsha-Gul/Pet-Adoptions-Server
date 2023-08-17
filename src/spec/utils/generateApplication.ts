import { User } from '../../models/User'
import {
  Application as ApplicationModel,
  ResidenceType,
  Status
} from '../../models/Application'
import { generatePets } from './generatePet'
import { generateShelters } from './generateShelters'
import { Pet } from '../../models/Pet'

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

export const generateApplicationData = (
  shelterID: string,
  microchipID: string
) => {
  return {
    shelterID: shelterID,
    microchipID: microchipID,
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
  }
}

export const generateApplication = async (
  shelterID: string,
  microchipID: string,
  applicantEmail: string
) => {
  const application = new ApplicationModel({
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

export const generateApplications = async () => {
  await generateShelters()
  const shelters = await User.find({ role: 'SHELTER' })
  await generatePets()
  const pets = await Pet.find({})

  const applicationsData = [
    {
      shelterID: shelters[0]._id.toString(),
      microchipID: pets[0].microchipID,
      applicantEmail: 'test@gmail.com',
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
      petOutlivePlans: 'friend will take care of him',
      status: Status.UnderReview
    },
    {
      shelterID: shelters[1]._id.toString(),
      microchipID: pets[1].microchipID,
      applicantEmail: 'test@gmail.com',
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
      petOutlivePlans: 'friend will take care of him',
      status: Status.HomeVisitRequested
    },
    {
      shelterID: shelters[1]._id.toString(),
      microchipID: pets[2].microchipID,
      applicantEmail: 'test@gmail.com',
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
      petOutlivePlans: 'friend will take care of him',
      status: Status.HomeVisitScheduled
    },
    {
      shelterID: shelters[1]._id.toString(),
      microchipID: pets[3].microchipID,
      applicantEmail: 'test@gmail.com',
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
      petOutlivePlans: 'friend will take care of him',
      status: Status.HomeApproved
    },
    {
      shelterID: shelters[1]._id.toString(),
      microchipID: pets[4].microchipID,
      applicantEmail: 'test@gmail.com',
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
      petOutlivePlans: 'friend will take care of him',
      status: Status.HomeRejected
    },
    {
      shelterID: shelters[1]._id.toString(),
      microchipID: pets[5].microchipID,
      applicantEmail: 'test@gmail.com',
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
      petOutlivePlans: 'friend will take care of him',
      status: Status.UserVisitScheduled
    },
    {
      shelterID: shelters[1]._id.toString(),
      microchipID: pets[6].microchipID,
      applicantEmail: 'test@gmail.com',
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
      petOutlivePlans: 'friend will take care of him',
      status: Status.Approved
    },
    {
      shelterID: shelters[1]._id.toString(),
      microchipID: pets[7].microchipID,
      applicantEmail: 'test@gmail.com',
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
      petOutlivePlans: 'friend will take care of him',
      status: Status.Rejected
    },
    {
      shelterID: shelters[1]._id.toString(),
      microchipID: pets[8].microchipID,
      applicantEmail: 'test@gmail.com',
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
      petOutlivePlans: 'friend will take care of him',
      status: Status.Closed
    }
  ]

  const applications = applicationsData.map(
    (data) => new ApplicationModel(data)
  )
  await ApplicationModel.insertMany(applications)
}

export const removeAllApplications = async () => {
  await ApplicationModel.deleteMany({})
}
