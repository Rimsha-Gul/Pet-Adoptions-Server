import transporter from '../plugins/nodemailer.plugin'

export const sendSignupEmail = async (): Promise<void> => {
  const mailOptions = {
    from: process.env.NODEMAILER_USER,
    to: process.env.NODEMAILER_RECIPIENT,
    subject: 'Purrfect Adoptions - Rimsha Gul',
    text: 'Adopt a pet perfect for you.'
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('Signup email sent: ' + info.response)
  } catch (error) {
    console.error('Error sending signup email:', error)
  }
}
