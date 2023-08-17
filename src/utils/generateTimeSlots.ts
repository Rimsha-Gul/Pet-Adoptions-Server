export const generateTimeSlots = () => {
  const slots: string[] = []
  for (let hour = 9; hour < 18; hour++) {
    slots.push(`${hour}:00`)
  }
  return slots
}
