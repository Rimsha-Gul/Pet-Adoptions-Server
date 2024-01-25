import { User } from '../../models/User'
import {
  ActivityNeeds,
  Category,
  Gender,
  LevelOfGrooming,
  Pet as PetModel
} from '../../models/Pet'
import { generateShelters } from './generateShelters'
import { generateApplication } from './generateApplication'
import { Application } from '../../models/Application'

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
  applicationID?: string
}

export const generatePetData = async () => {
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

export const generatePet = async () => {
  await generateShelters()
  const shelters = await User.find({ role: 'SHELTER' })
  const pet = new PetModel({
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
  })
  await pet.save()
}

export const generatePets = async () => {
  await generateShelters()
  const shelters = await User.find({ role: 'SHELTER' })

  const oneYearAndOneMonthAgo = new Date()
  oneYearAndOneMonthAgo.setFullYear(oneYearAndOneMonthAgo.getFullYear() - 1)
  oneYearAndOneMonthAgo.setMonth(oneYearAndOneMonthAgo.getMonth() - 1)
  const birthDate = oneYearAndOneMonthAgo.toISOString().split('T')[0]

  const today = new Date()
  const futureDay = today.getDate() + 2 // two days ahead than current day
  const birthdate = new Date(
    today.getFullYear(),
    today.getMonth() - 1,
    futureDay
  )

  const petsData = [
    {
      shelterID: shelters[0]._id.toString(),
      microchipID: 'A123456799',
      name: 'Max',
      gender: Gender.Male,
      birthDate: birthDate,
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
      adoptionFee: '200 USD',
      images: ['mockFileID1', 'mockFileID2', 'mockFileID3'],
      isAdopted: false
    },
    {
      shelterID: shelters[1]._id.toString(),
      microchipID: 'A123456788',
      name: 'Snowball',
      gender: Gender.Male,
      birthDate: birthdate,
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
      adoptionFee: '200 USD',
      images: ['mockFileID1', 'mockFileID2', 'mockFileID3'],
      isAdopted: false
    },
    {
      shelterID: shelters[1]._id.toString(),
      microchipID: 'A123456778',
      name: 'Snowflake',
      gender: Gender.Male,
      birthDate: birthDate,
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
      adoptionFee: '200 USD',
      images: ['mockFileID1', 'mockFileID2', 'mockFileID3'],
      isAdopted: false
    },
    {
      shelterID: shelters[1]._id.toString(),
      microchipID: 'A123456678',
      name: 'Cotton',
      gender: Gender.Male,
      birthDate: birthDate,
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
      adoptionFee: '200 USD',
      images: ['mockFileID1', 'mockFileID2', 'mockFileID3'],
      isAdopted: false
    },
    {
      shelterID: shelters[1]._id.toString(),
      microchipID: 'A123455678',
      name: 'Marbles',
      gender: Gender.Male,
      birthDate: birthDate,
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
      adoptionFee: '200 USD',
      images: ['mockFileID1', 'mockFileID2', 'mockFileID3'],
      isAdopted: false
    },
    {
      shelterID: shelters[1]._id.toString(),
      microchipID: 'A123445678',
      name: 'Willow',
      gender: Gender.Male,
      birthDate: birthDate,
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
      adoptionFee: '200 USD',
      images: ['mockFileID1', 'mockFileID2', 'mockFileID3'],
      isAdopted: false
    },
    {
      shelterID: shelters[1]._id.toString(),
      microchipID: 'A123345678',
      name: 'Cotton Candy',
      gender: Gender.Male,
      birthDate: birthDate,
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
      adoptionFee: '200 USD',
      images: ['mockFileID1', 'mockFileID2', 'mockFileID3'],
      isAdopted: false
    },
    {
      shelterID: shelters[1]._id.toString(),
      microchipID: 'A122345678',
      name: 'Marbles',
      gender: Gender.Male,
      birthDate: birthDate,
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
      adoptionFee: '200 USD',
      images: ['mockFileID1', 'mockFileID2', 'mockFileID3'],
      isAdopted: false
    },
    {
      shelterID: shelters[1]._id.toString(),
      microchipID: 'A112345678',
      name: 'Marshmellow',
      gender: Gender.Male,
      birthDate: birthDate,
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
      adoptionFee: '200 USD',
      images: ['mockFileID1', 'mockFileID2', 'mockFileID3'],
      isAdopted: false
    }
  ]

  const pets = petsData.map((data) => new PetModel(data))
  await PetModel.insertMany(pets)
}

export const removeAllPets = async (category?: Category) => {
  await PetModel.deleteMany({ category: category })
}

export const removePets = async () => {
  await PetModel.deleteMany({})
}

export const generatePetWithApplication = async (applicantEmail: string) => {
  const pet: Pet = await generatePetData()
  await generateApplication(pet.shelterID, pet.microchipID, applicantEmail)
  const application = await Application.findOne({
    microchipID: pet.microchipID,
    applicantEmail: applicantEmail
  })

  await generateShelters()
  const shelters = await User.find({ role: 'SHELTER' })

  const newPet = new PetModel({
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
    adoptionFee: '200 USD',
    applicationID: application?._id.toString()
  })
  await newPet.save()
  return application?._id
}
