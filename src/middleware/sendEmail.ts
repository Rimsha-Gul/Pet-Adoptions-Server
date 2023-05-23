import transporter from '../plugins/nodemailer.plugin'

export const sendEmail = async (
  recipientEmail: string,
  subject: string,
  message: string
): Promise<void> => {
  const mailOptions = {
    from: process.env.NODEMAILER_USER,
    to: `${recipientEmail}`,
    subject: `${subject}`,
    html: `${message}`
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('Signup email sent: ' + info)
  } catch (error) {
    console.error('Error sending signup email:', error)
  }
}
