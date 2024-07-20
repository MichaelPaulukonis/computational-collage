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

  // when would we ever do this ?!?!?!?!?
  set original (original) {
    this.orig = original
  }

  get clone () {
    const tOrig = this.orig.get()
    const tCrop = this.cropd.get()
    return new CollageImage(tOrig, tCrop)
  }
}

export class OutlineableImage {
  constructor ({ img, vectors = []}) {
    this.vectors = vectors
    this.image = img
    this.offset = { x: this.image.width / 2, y: this.image.height / 2 }
    this.scaling = 1
  }

  get cropped () {
    return this.image
  }

  get clone () {
    const tImage = this.image.get()
    const tVectors = JSON.parse(JSON.stringify(this.vectors))
    return new OutlineableImage({ img: tImage, vectors: tVectors})
  }

  // ooooh, vertexes need scaling applied...
  draw ({ x, y, scaling, target, config }) {
    if (config.outline) {
      target.strokeWeight(config.outlineWeight) // something different than other type
      target.stroke(config.outlineColor)
      target.noFill()
      target.beginShape()
      for (let v of this.vectors) {
        target.vertex(
          (v.x + x - this.offset.x) * scaling,
          (v.y + y - this.offset.y) * scaling
        )
      }
      target.endShape(CLOSE)
    }
    target.image(
      this.image,
      x,
      y,
      this.image.width * scaling,
      this.image.height * scaling
    )
  }
}

// storage of CollageImage[]
export class Images {
  constructor (images = [], outlined = []) {
    this.imgs = images
    this.outlined = outlined
  }

  get images () {
    return this.imgs
  }

  get outlineds () {
    return this.outlined
  }

  get random () {
    // TODO: or random outlined images
    return this.imgs[Math.floor(Math.random() * this.imgs.length)]
  }

  addImage (imgobj) {
    let coll = imgobj instanceof CollageImage ? this.imgs : this.outlined
    coll.push(imgobj)
  }

  clear () {
    this.imgs = []
    this.outlined = []
  }
}
