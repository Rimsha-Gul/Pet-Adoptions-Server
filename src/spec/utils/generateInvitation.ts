import { generateInvitationToken } from '../../utils/generateInvitationToken'
import Invitation, { InvitationStatus } from '../../models/Invitation'
import { Role } from '../../models/User'

export interface Invitation {
  shelterEmail: string
  invitationToken: string
  status: InvitationStatus
}

export const generateInvitation = async () => {
  const invitationToken = generateInvitationToken(
    'shelter1@test.com',
    Role.Shelter
  )
  const invitation = new Invitation({
    shelterEmail: 'shelter1@test.com',
    invitationToken: invitationToken,
    status: InvitationStatus.Pending
  })
  await invitation.save()
}
