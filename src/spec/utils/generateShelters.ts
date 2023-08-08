import { User } from '../../models/User'

export const generateShelters = async () => {
  const sheltersData = [
    {
      email: 'shelter1@test.com',
      password: 'password',
      name: 'Shelter 1',
      role: 'SHELTER',
      rating: 0,
      numberOfReviews: 0
    },
    {
      email: 'shelter2@test.com',
      password: 'password',
      name: 'Shelter 2',
      role: 'SHELTER'
    },
    {
      email: 'shelter3@test.com',
      password: 'password',
      name: 'Shelter 3',
      role: 'SHELTER'
    }
  ]

  const shelters = sheltersData.map((data) => new User(data))
  await User.insertMany(shelters)
}

export const removeAllShelters = async () => {
  await User.deleteMany({ role: 'SHELTER' })
}
