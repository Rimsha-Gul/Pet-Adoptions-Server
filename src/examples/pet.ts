import { ActivityNeeds, Category, Gender, LevelOfGrooming } from '../models/Pet'

export const petResponseExample = {
  name: 'Meredith',
  gender: 'MALE',
  age: '2yr 4m',
  color: 'white',
  breed: 'Mini Lop',
  category: 'HORSE',
  activityNeeds: 'HIGH',
  levelOfGrooming: 'MEDIUM',
  isHouseTrained: 'true',
  healthCheck: 'true',
  microchip: 'true',
  wormed: 'true',
  heartwormTreated: 'true',
  vaccinated: 'true',
  deSexed: 'true',
  bio: 'Meredith is a playful and friendly cat. She loves chasing laser pointers and enjoys cuddling on the couch.',
  traits: 'playful,athletic,kid-friendly',
  adoptionFee: '$300'
}

export const petsResponseExample = {
  pets: [
    {
      name: 'Fluffy',
      gender: Gender.Female,
      age: '2 yR',
      color: 'White',
      breed: 'Persian',
      category: Category.Cat,
      activityNeeds: ActivityNeeds.Low,
      levelOfGrooming: LevelOfGrooming.High,
      isHouseTrained: true,
      healthInfo: {
        healthCheck: true,
        microchip: true,
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
      ]
    },
    {
      name: 'Buddy',
      gender: Gender.Male,
      age: '3 yR',
      color: 'Brown',
      breed: 'Labrador Retriever',
      category: Category.Dog,
      activityNeeds: ActivityNeeds.High,
      levelOfGrooming: LevelOfGrooming.Medium,
      isHouseTrained: true,
      healthInfo: {
        healthCheck: true,
        microchip: true,
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
      ]
    }
  ],
  totalPages: 5,
  colors: ['White', 'Black', 'Brown'],
  breeds: ['Persian', 'Labrador Retriever', 'Golden Retriever'],
  genders: ['Male', 'Female'],
  ages: ['1 year', '2 years', '3 years']
}
