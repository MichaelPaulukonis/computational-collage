export class CollageImage {
  constructor (img, cropped) {
    this.original = img
    this.cropped = cropped
  }

  get cropped () {
    return this.cropped
  }

  set cropped (cropped) {
    this.cropped = cropped
  }

  get original () {
    return this.original
  }

  set original (original) {
    this.original = original
  }
}

// storage of CollageImage[]
export class Images {
  constructor (images = []) {
    this.images = images
  }

  get random () {
    return this.images[Math.floor(Math.random() * this.images.length)]
  }

  addImage (collageImg) {
    this.images.push(collageImg)
  }
}
