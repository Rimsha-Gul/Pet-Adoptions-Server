export const getImageURL = (imageID: string) => {
  const imageURL = `https://drive.google.com/uc?export=view&id=${imageID}`
  return imageURL
}
