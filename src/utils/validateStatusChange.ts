import { Status } from '../models/Application'
import { Role } from '../models/User'

const ROLE_PERMISSIONS: Record<Role, Status[]> = {
  [Role.User]: [],
  [Role.Shelter]: [
    Status.HomeVisitRequested,
    Status.HomeApproved,
    Status.HomeRejected,
    Status.Approved,
    Status.Rejected
  ],
  [Role.Admin]: []
}

// Function to validate status changes based on role and status.
export const validateStatusChange = (role: Role, status: Status): boolean => {
  // Get the array of statuses the role can assign.
  const allowedStatuses = ROLE_PERMISSIONS[role]

  // Check if the given status is in the array of allowed statuses for the role.
  return allowedStatuses.includes(status)
}
