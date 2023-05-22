import nodemailer from 'nodemailer'

/***********************************
 *     Nodemailer Initialization   *
 ***********************************/

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'purrfectadoptions161@gmail.com',
    pass: 'warzuiljwwctffoa'
  }
})
export default transporter
