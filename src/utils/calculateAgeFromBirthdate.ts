export function calculateAgeFromBirthdate(birthdate: Date): number {
  const today = new Date()
  let age = today.getFullYear() - birthdate.getFullYear()
  const monthDiff = today.getMonth() - birthdate.getMonth()

  // Adjust age if the birthdate has not been reached yet this year
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthdate.getDate())
  ) {
    age--
  }
  console.log('converted age: ', age)
  return age
}
