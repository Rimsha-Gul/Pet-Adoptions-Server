import { Visit as VisitModel, VisitType } from '../../models/Visit'

export const generateVisit = async (
  applicationID: string,
  shelterID: string,
  petID: string,
  applicantEmail: string,
  visitDate: string,
  visitType: VisitType
) => {
  const visit = new VisitModel({
    applicationID: applicationID,
    shelterID: shelterID,
    petID: petID,
    applicantEmail: applicantEmail,
    visitDate: visitDate,
    visitType: visitType
  })
  await visit.save()
}

export const generateAllVisitsForDate = async (
  applicationID: string,
  shelterID: string,
  petID: string,
  applicantEmail: string,
  visitDate: string,
  visitType: VisitType
) => {
  const startHour = 4 // 04:00 local 9:00am
  const endHour = 12 // 12:00 local 5:00pm

  // Iterate over the range of hours and generate visits
  for (let hour = startHour; hour <= endHour; hour++) {
    const visitDateTime = `${visitDate}T${String(hour).padStart(2, '0')}:00:00Z`

    const visit = new VisitModel({
      applicationID,
      shelterID,
      petID,
      applicantEmail,
      visitDate: visitDateTime,
      visitType
    })

    await visit.save()
  }
}

export const removeAllVisits = async () => {
  await VisitModel.deleteMany({})
}
