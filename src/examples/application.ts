import { ResidenceType } from '../models/Application'

export const applicationExample = {
  shelterID: '6475e9630044288a2b4880b5',
  microchipID: 'A123456789',
  residenceType: ResidenceType.Own,
  hasRentPetPermission: true,
  isWillingHomeInspection: true,
  hasChildren: true,
  childrenAges: '2,6',
  hasOtherPets: true,
  otherPetsInfo: 'Cat 1, Dog 2',
  petAloneTime: 6,
  hasPlayTimeParks: true,
  petActivities: 'Playing fetch, walking',
  handlePetIssues: 'I will buy new shoes',
  moveWithPet: 'I will take him with me',
  canAffordPetsNeeds: true,
  canAffordPetsMediacal: true,
  petTravelPlans: 'I will take him wherever I go',
  petOutlivePlans:
    'My pet will inherit my property and my friend Alex will take care of him'
}
