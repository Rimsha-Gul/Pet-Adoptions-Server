import { generateInvitationToken } from '../../utils/generateInvitationToken'
import Invitation, { InvitationStatus } from '../../models/Invitation'
import { Role } from '../../models/User'
import { generateExpiredInvitationToken } from './generateExpiredToken'

export interface Invitation {
  shelterEmail: string
  invitationToken: string
  status: InvitationStatus
}

export const generateInvitation = async (shelterEmail: string) => {
  const invitationToken = generateInvitationToken(shelterEmail, Role.Shelter)
  const invitation = new Invitation({
    shelterEmail: shelterEmail,
    invitationToken: invitationToken,
    status: InvitationStatus.Pending
  })
  await invitation.save()
  return invitationToken
}

export const generateExpiredInvitation = async (shelterEmail: string) => {
  const invitationToken = generateExpiredInvitationToken(shelterEmail)
  const invitation = new Invitation({
    shelterEmail: shelterEmail,
    invitationToken: invitationToken,
    status: InvitationStatus.Pending
  })
  await invitation.save()
  return invitationToken
}

export const generateAcceptedInvitation = async (shelterEmail: string) => {
  const invitationToken = generateInvitationToken(shelterEmail, Role.Shelter)
  const invitation = new Invitation({
    shelterEmail: shelterEmail,
    invitationToken: invitationToken,
    status: InvitationStatus.Accepted
  })
  await invitation.save()
  return invitationToken
}
