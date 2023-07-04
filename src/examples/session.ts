import { Role } from '../models/User'

export const sessionResponseExample = {
  name: 'John Doe',
  email: 'johndoe@example.com',
  role: Role.User,
  address: '123 Main St',
  bio: 'Pet lover with years of experience fostering cats and dogs. I have a spacious home with a large, secure backyard. I love active pets and have a preference for medium to large dogs.',
  profilePhoto: 'https://example.com/userProfilePhoto.jpg'
}
