import { ReactivationRequest } from '../../models/ReactivationRequest'

export const generateReactivationRequest = async (applicationID: string) => {
  const reactivationRequest = new ReactivationRequest({
    applicationID: applicationID,
    reasonNotScheduled:
      'I had an unexpected personal commitment that consumed my attention during that time, and I missed the scheduling window.',
    reasonToReactivate:
      'The commitment has been addressed, and I am now fully available to proceed with the visit scheduling.'
  })
  await reactivationRequest.save()
}

export const removeAllReactivationRequests = async () => {
  await ReactivationRequest.deleteMany({})
}
