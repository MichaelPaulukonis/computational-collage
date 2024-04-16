export class CollageImage {
  constructor (img = null, cropped = null) {
    this.orig = img
    this.cropd = cropped
  }

  get cropped () {
    return this.cropd
  }

  set cropped (cropped) {
    this.cropd = cropped
  }

  get original () {
    return this.orig
  }

  set original (original) {
    this.orig = original
  }
}

// storage of CollageImage[]
export class Images {
  constructor (images = []) {
    this.imgs = images
  }

  get images () {
    return this.imgs
  }

  get random () {
    return this.imgs[Math.floor(Math.random() * this.imgs.length)]
  }

  addImage (collageImg) {
    this.imgs.push(collageImg)
  }

  clear () {
    this.imgs = []
  }
}
