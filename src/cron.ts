import cron from 'node-cron'
import { Application, Status } from './models/Application'

const expireApplications = async (): Promise<void> => {
  // Get the current date in local time
  const todayLocal = new Date()

  // Set the time to midnight in local time
  todayLocal.setHours(0, 0, 0, 0)

  // Convert to UTC time
  const expiryDateInUTC = new Date(
    Date.UTC(
      todayLocal.getFullYear(),
      todayLocal.getMonth(),
      todayLocal.getDate(),
      18,
      59,
      59,
      999
    )
  )

  await Application.updateMany(
    { homeVisitScheduleExpiryDate: expiryDateInUTC },
    { status: Status.Expired }
  )
}

// Run the expireApplications function every day at midnight.
const Cron = () => {
  cron.schedule('0 0 * * *', expireApplications)
}

export default Cron
