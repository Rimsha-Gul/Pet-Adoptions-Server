import { ActivityNeeds, Category, Gender, LevelOfGrooming } from '../models/Pet'

export const petResponseExample = {
  pet: {
    shelterName: 'Purrfect Adoption Center',
    microchipID: 'A123456789',
    name: 'Snowball',
    gender: Gender.Male,
    birthDate: '2001-01-01',
    color: 'white',
    breed: 'Mini Lop',
    category: Category.Cat,
    activityNeeds: ActivityNeeds.Low,
    levelOfGrooming: LevelOfGrooming.High,
    isHouseTrained: true,
    healthInfo: {
      healthCheck: true,
      allergiesTreated: true,
      wormed: true,
      heartwormTreated: true,
      vaccinated: true,
      deSexed: true
    },
    bio: 'Meredith is a playful and friendly cat. She loves chasing laser pointers and enjoys cuddling on the couch.',
    traits: ['Affectionate', 'independent'],
    adoptionFee: '$300',
    images: [
      'https://example.com/images/fluffy1.jpg',
      'https://example.com/images/fluffy2.jpg'
    ],
    hasAdoptionRequest: false,
    isAdopted: false
  }
}

export const petsResponseExample = {
  pets: [
    {
      shelterName: 'Purrfect Adoption Center',
      microchipID: 'A123456789',
      name: 'Fluffy',
      gender: Gender.Female,
      birthDate: '2001-01-01',
      color: 'White',
      breed: 'Persian',
      category: Category.Cat,
      activityNeeds: ActivityNeeds.Low,
      levelOfGrooming: LevelOfGrooming.High,
      isHouseTrained: true,
      healthInfo: {
        healthCheck: true,
        allergiesTreated: true,
        wormed: true,
        heartwormTreated: true,
        vaccinated: true,
        deSexed: true
      },
      bio: 'Fluffy is a calm and friendly cat...',
      traits: ['Affectionate', 'independent'],
      adoptionFee: '$100',
      images: [
        'https://example.com/images/fluffy1.jpg',
        'https://example.com/images/fluffy2.jpg'
      ],
      hasAdoptionRequest: false,
      isAdopted: true
    },
    {
      shelterName: 'Furry Adoption Center',
      microchipID: 'B123456789',
      name: 'Buddy',
      gender: Gender.Male,
      birthDate: '2001-01-01',
      color: 'Brown',
      breed: 'Labrador Retriever',
      category: Category.Dog,
      activityNeeds: ActivityNeeds.High,
      levelOfGrooming: LevelOfGrooming.Medium,
      isHouseTrained: true,
      healthInfo: {
        healthCheck: true,
        allergiesTreated: true,
        wormed: true,
        heartwormTreated: true,
        vaccinated: true,
        deSexed: true
      },
      bio: 'Buddy is a playful and energetic dog...',
      traits: ['Friendly', 'loyal'],
      adoptionFee: '$150',
      images: [
        'https://example.com/images/buddy1.jpg',
        'https://example.com/images/buddy2.jpg'
      ],
      hasAdoptionRequest: false,
      isAdopted: false
    }
  ],
  totalPages: 5,
  colors: ['White', 'Black', 'Brown'],
  breeds: ['Persian', 'Labrador Retriever', 'Golden Retriever'],
  genders: ['Male', 'Female'],
  ages: [1, 2, 3, 4, 5]
}
