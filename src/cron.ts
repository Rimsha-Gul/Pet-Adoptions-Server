import cron from 'node-cron'
import { Application, Status } from './models/Application'

const expireApplications = async (): Promise<void> => {
  const today = new Date().setHours(0, 0, 0, 0)
  await Application.updateMany(
    { homeVisitScheduleExpiryDate: today },
    { status: Status.Expired }
  )
}

// Run the expireApplications function every day at midnight.
const Cron = () => {
  cron.schedule('0 0 * * *', expireApplications)
}

export default Cron
