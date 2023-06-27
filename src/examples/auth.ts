export const signupResponseExample = {
  name: 'John Doe',
  email: 'johndoe@example.com'
}

export const verificationResponseExample = {
  isVerified: true,
  tokens: {
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
}

export const tokenResponseExample = {
  tokens: {
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
}

export const changeEmailPayloadExample = {
  email: 'johndoe@example.com'
}

export const checkPasswordPayloadExample = {
  password: '123456'
}

export const updateProfilePayloadExample = {
  address: '123 Main St',
  bio: 'Pet lover with years of experience fostering cats and dogs. I have a spacious home with a large, secure backyard. I love active pets and have a preference for medium to large dogs.',
  profilePhoto: 'https://example.com/userProfilePhoto.jpg',
  removeProfilePhoto: true
}

export const shelterResponseExample = {
  id: '60df5df17f4c6a01ac63491c',
  name: 'Furry Friends Sanctuary'
}
