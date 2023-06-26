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

export const shelterResponseExample = {
  id: '60df5df17f4c6a01ac63491c',
  name: 'Furry Friends Sanctuary'
}
