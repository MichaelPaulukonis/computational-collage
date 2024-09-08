export class CollageImage {
  constructor ({ img = null }) {
    this.orig = img
  }

  get original () {
    return this.orig
  }
}

export class CroppableImage extends CollageImage {
  constructor ({ img = null, cropped = null }) {
    super({ img })
    this.cropd = cropped
  }

  get cropped () {
    return this.cropd
  }

  set cropped (cropped) {
    this.cropd = cropped
  }

  get clone () {
    const tOrig = this.orig.get()
    const tCrop = this.cropd.get()
    return new CroppableImage({ img: tOrig, cropped: tCrop })
  }
}

export class OutlineableImage extends CollageImage {
  constructor ({ img, vectors = [] }) {
    super({ img })
    this.vectors = vectors
    this.offset = { x: this.orig.width / 2, y: this.orig.height / 2 }
    this.scaling = 1
  }

  get clone () {
    const tImage = this.orig.get()
    const tVectors = JSON.parse(JSON.stringify(this.vectors))
    return new OutlineableImage({ img: tImage, vectors: tVectors})
  }

  draw ({ x, y, scaling, target, config }) {
    if (config.outline) {
      target.strokeWeight(config.outlineWeight) // something different than other type
      target.stroke(config.outlineColor)
      target.noFill()
      target.beginShape()
      for (const v of this.vectors) {
        target.vertex(
          (v.x + x - this.offset.x) * scaling,
          (v.y + y - this.offset.y) * scaling
        )
      }
      target.endShape(CLOSE)
    }
    target.image(
      this.orig,
      x,
      y,
      this.orig.width * scaling,
      this.orig.height * scaling
    )
  }
}

// storage of CollageImage[]
export class Images {
  constructor (images = [], outlined = []) {
    this.imgs = [...images, ...outlined]
  }

  get images () {
    return this.imgs
  }

  get croppeds () {
    return this.imgs.filter(i => i instanceof CroppableImage)
  }

  get outlineds () {
    return this.imgs.filter(i => i instanceof OutlineableImage)
  }

  get random () {
    // TODO: or random outlined images
    return this.croppeds[Math.floor(Math.random() * this.croppeds.length)]
  }

  addImage (imgobj) {
    this.imgs.push(imgobj)
  }

  // will this work???
  removeImage (imgobj) {
    this.imgs = this.imgs.filter(i => i !== imgobj)
  }
}
