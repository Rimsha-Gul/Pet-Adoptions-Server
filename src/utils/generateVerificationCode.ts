export function generateVerificationCode(): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString() // Generate a random 6-digit code
  return code
}
