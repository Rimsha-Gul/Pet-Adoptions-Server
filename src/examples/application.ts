import { ResidenceType, Status } from '../models/Application'

export const applicationExample = {
  application: {
    id: '64b14bd7ba2fba2af4b5338d',
    status: Status.UnderReview,
    submissionDate: '2020-01-20',
    petImage: 'https://example.com/images/fluffy1.jpg',
    petName: 'Fluffy',
    shelterName: 'Animal Haven Shelter',
    shelterID: '6475e9630044288a2b4880b5',
    microchipID: 'A123456789',
    residenceType: ResidenceType.Own,
    hasRentPetPermission: true,
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
    canAffordPetsMedical: true,
    petTravelPlans: 'I will take him wherever I go',
    petOutlivePlans:
      'My pet will inherit my property and my friend Alex will take care of him'
  },
  canReview: true
}

export const allApplicationsExample = {
  applications: [
    {
      id: '64b14bd7ba2fba2af4b5338d',
      status: Status.UnderReview,
      submissionDate: '2020-01-20',
      petImage: 'https://example.com/images/fluffy1.jpg',
      petName: 'Fluffy',
      shelterName: 'Animal Haven Shelter',
      shelterID: '6475e9630044288a2b4880b5',
      microchipID: 'A123456789',
      residenceType: ResidenceType.Own,
      hasRentPetPermission: true,
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
      canAffordPetsMedical: true,
      petTravelPlans: 'I will take him wherever I go',
      petOutlivePlans:
        'My pet will inherit my property and my friend Alex will take care of him',
      applicantName: 'John Doe',
      homeVisitDate: '2023-08-19T06:00:00Z',
      shelterVisitDate: '2023-09-02T04:00:00Z',
      homeVisitEmailSentDate: '2023-08-15T10:51:48.510Z',
      shelterVisitEmailSentDate: '2023-08-31T10:51:48.510Z'
    },
    {
      id: '64b14bd7ba2fba2af4b5338e',
      status: Status.Approved,
      submissionDate: '2020-02-25',
      petImage: 'https://example.com/images/buddy1.jpg',
      petName: 'Buddy',
      shelterName: 'Furry Friends Shelter',
      shelterID: '6475e9630044288a2b4880b6',
      microchipID: 'A987654321',
      residenceType: ResidenceType.Rent,
      hasRentPetPermission: true,
      hasChildren: false,
      childrenAges: '',
      hasOtherPets: false,
      otherPetsInfo: '',
      petAloneTime: 4,
      hasPlayTimeParks: true,
      petActivities: 'Running, hiking',
      handlePetIssues: 'I will provide training',
      moveWithPet: 'I will take him with me',
      canAffordPetsNeeds: true,
      canAffordPetsMedical: true,
      petTravelPlans: 'I have a trusted pet sitter',
      petOutlivePlans: 'My sister will take care of him',
      applicantName: 'Jane Smith',
      homeVisitDate: '2023-08-19T06:00:00Z',
      shelterVisitDate: '2023-09-02T04:00:00Z',
      homeVisitEmailSentDate: '2023-08-15T10:51:48.510Z',
      shelterVisitEmailSentDate: '2023-08-31T10:51:48.510Z'
    }
  ],
  totalPages: 10,
  applicationStatuses: [Status.UnderReview, Status.Approved, Status.Rejected]
}

export const timeSlotsResponseExample = {
  availableTimeSlots: [
    '9:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00'
  ]
}

export const updateApplicationExample = {
  id: '6475e9630044288a2b4880b5',
  status: Status.UnderReview
}

export const scheduleHomeVisitPayloadExample = {
  id: '6475e9630044288a2b4880b5',
  visitDate: '2020-01-01T12:00:00'
}
