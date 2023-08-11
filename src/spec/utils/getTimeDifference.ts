export const dateDifferenceInSeconds = (date1, date2) => {
  return Math.abs(date1.getTime() - date2.getTime()) / 1000
}

export const dateDifferenceInDays = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000 // hours*minutes*seconds*milliseconds
  const firstDate = new Date(date1).getTime()
  const secondDate = new Date(date2).getTime()

  const diffDays = Math.round(Math.abs((firstDate - secondDate) / oneDay))
  return diffDays
}
