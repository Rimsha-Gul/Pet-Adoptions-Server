import { User } from '../../models/User'
import Pet, {
  ActivityNeeds,
  Category,
  Gender,
  LevelOfGrooming
} from '../../models/Pet'
import { generateShelters } from './generateShelters'

export interface Pet {
  shelterID: string
  microchipID: string
  name: string
  gender: Gender
  birthDate: string
  color: string
  breed: string
  category: Category
  activityNeeds: ActivityNeeds
  levelOfGrooming: LevelOfGrooming
  isHouseTrained: boolean
  healthCheck: boolean
  allergiesTreated: boolean
  wormed: boolean
  heartwormTreated: boolean
  vaccinated: boolean
  deSexed: boolean
  bio: string
  traits: string
  adoptionFee: string
}

export const generatePet = async () => {
  await generateShelters()
  const shelters = await User.find({ role: 'SHELTER' })
  return {
    shelterID: shelters[0]._id.toString(),
    microchipID: 'A123456789',
    name: 'Max',
    gender: Gender.Male,
    birthDate: '2022-01-01',
    color: 'Brown',
    breed: 'Labrador',
    category: Category.Dog,
    activityNeeds: ActivityNeeds.High,
    levelOfGrooming: LevelOfGrooming.Medium,
    isHouseTrained: true,
    healthCheck: true,
    allergiesTreated: false,
    wormed: true,
    heartwormTreated: true,
    vaccinated: true,
    deSexed: true,
    bio: 'This is Max, a friendly Labrador.',
    traits: 'Active, Friendly, Playful',
    adoptionFee: '200 USD'
  }
}

export const generatePets = async () => {
  await generateShelters()
  const shelters = await User.find({ role: 'SHELTER' })

  const petsData = [
    {
      shelterID: shelters[0]._id.toString(),
      microchipID: 'A123456799',
      name: 'Max',
      gender: Gender.Male,
      birthDate: '2022-01-01',
      color: 'Brown',
      breed: 'Labrador',
      category: Category.Dog,
      activityNeeds: ActivityNeeds.High,
      levelOfGrooming: LevelOfGrooming.Medium,
      isHouseTrained: true,
      healthInfo: {
        healthCheck: true,
        allergiesTreated: false,
        wormed: true,
        heartwormTreated: true,
        vaccinated: true,
        deSexed: true
      },
      bio: 'This is Max, a friendly Labrador.',
      traits: 'Active, Friendly, Playful',
      adoptionFee: '200 USD'
    },
    {
      shelterID: shelters[1]._id.toString(),
      microchipID: 'A123456788',
      name: 'Max',
      gender: Gender.Male,
      birthDate: '2022-01-01',
      color: 'Brown',
      breed: 'Labrador',
      category: Category.Cat,
      activityNeeds: ActivityNeeds.High,
      levelOfGrooming: LevelOfGrooming.Medium,
      isHouseTrained: true,
      healthInfo: {
        healthCheck: true,
        allergiesTreated: false,
        wormed: true,
        heartwormTreated: true,
        vaccinated: true,
        deSexed: true
      },
      bio: 'This is Max, a friendly Labrador.',
      traits: 'Active, Friendly, Playful',
      adoptionFee: '200 USD'
    },
    {
      shelterID: shelters[1]._id.toString(),
      microchipID: 'A123456778',
      name: 'Max',
      gender: Gender.Male,
      birthDate: '2022-01-01',
      color: 'Brown',
      breed: 'Labrador',
      category: Category.Bird,
      activityNeeds: ActivityNeeds.High,
      levelOfGrooming: LevelOfGrooming.Medium,
      isHouseTrained: true,
      healthInfo: {
        healthCheck: true,
        allergiesTreated: false,
        wormed: true,
        heartwormTreated: true,
        vaccinated: true,
        deSexed: true
      },
      bio: 'This is Max, a friendly Labrador.',
      traits: 'Active, Friendly, Playful',
      adoptionFee: '200 USD'
    },
    {
      shelterID: shelters[1]._id.toString(),
      microchipID: 'A123456678',
      name: 'Max',
      gender: Gender.Male,
      birthDate: '2022-01-01',
      color: 'Brown',
      breed: 'Labrador',
      category: Category.Barnyard,
      activityNeeds: ActivityNeeds.High,
      levelOfGrooming: LevelOfGrooming.Medium,
      isHouseTrained: true,
      healthInfo: {
        healthCheck: true,
        allergiesTreated: false,
        wormed: true,
        heartwormTreated: true,
        vaccinated: true,
        deSexed: true
      },
      bio: 'This is Max, a friendly Labrador.',
      traits: 'Active, Friendly, Playful',
      adoptionFee: '200 USD'
    },
    {
      shelterID: shelters[1]._id.toString(),
      microchipID: 'A123455678',
      name: 'Max',
      gender: Gender.Male,
      birthDate: '2022-01-01',
      color: 'Brown',
      breed: 'Labrador',
      category: Category.Horse,
      activityNeeds: ActivityNeeds.High,
      levelOfGrooming: LevelOfGrooming.Medium,
      isHouseTrained: true,
      healthInfo: {
        healthCheck: true,
        allergiesTreated: false,
        wormed: true,
        heartwormTreated: true,
        vaccinated: true,
        deSexed: true
      },
      bio: 'This is Max, a friendly Labrador.',
      traits: 'Active, Friendly, Playful',
      adoptionFee: '200 USD'
    },
    {
      shelterID: shelters[1]._id.toString(),
      microchipID: 'A123445678',
      name: 'Max',
      gender: Gender.Male,
      birthDate: '2022-01-01',
      color: 'Brown',
      breed: 'Labrador',
      category: Category.Rabbit,
      activityNeeds: ActivityNeeds.High,
      levelOfGrooming: LevelOfGrooming.Medium,
      isHouseTrained: true,
      healthInfo: {
        healthCheck: true,
        allergiesTreated: false,
        wormed: true,
        heartwormTreated: true,
        vaccinated: true,
        deSexed: true
      },
      bio: 'This is Max, a friendly Labrador.',
      traits: 'Active, Friendly, Playful',
      adoptionFee: '200 USD'
    },
    {
      shelterID: shelters[1]._id.toString(),
      microchipID: 'A123345678',
      name: 'Max',
      gender: Gender.Male,
      birthDate: '2022-01-01',
      color: 'Brown',
      breed: 'Labrador',
      category: Category.ScalesFinsAndOthers,
      activityNeeds: ActivityNeeds.High,
      levelOfGrooming: LevelOfGrooming.Medium,
      isHouseTrained: true,
      healthInfo: {
        healthCheck: true,
        allergiesTreated: false,
        wormed: true,
        heartwormTreated: true,
        vaccinated: true,
        deSexed: true
      },
      bio: 'This is Max, a friendly Labrador.',
      traits: 'Active, Friendly, Playful',
      adoptionFee: '200 USD'
    },
    {
      shelterID: shelters[1]._id.toString(),
      microchipID: 'A122345678',
      name: 'Max',
      gender: Gender.Male,
      birthDate: '2022-01-01',
      color: 'Brown',
      breed: 'Labrador',
      category: Category.SmallAndFurry,
      activityNeeds: ActivityNeeds.High,
      levelOfGrooming: LevelOfGrooming.Medium,
      isHouseTrained: true,
      healthInfo: {
        healthCheck: true,
        allergiesTreated: false,
        wormed: true,
        heartwormTreated: true,
        vaccinated: true,
        deSexed: true
      },
      bio: 'This is Max, a friendly Labrador.',
      traits: 'Active, Friendly, Playful',
      adoptionFee: '200 USD'
    }
  ]

  const pets = petsData.map((data) => new Pet(data))
  await Pet.insertMany(pets)
}

export const removeAllPets = async (category?: Category) => {
  await Pet.deleteMany({ category: category })
}
