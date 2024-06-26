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
  constructor(img, vectors = [], thickness = 20) {
    this.vectors = vectors;
    this.image = img;
    this.offset = { x: this.image.width / 2, y: this.image.height / 2}
    this.thickness = thickness
    this.strokeColor = 0
    this.angle = 0
    this.length = 0
    this.rotation = 0
    this.scaling = 1
  }

  // TODO: will also need to pass in scale and rotation ?!?
  draw(x,y) {
    strokeWeight(thickness);
    stroke(this.strokeColor);
    noFill();
    beginShape();
    for (let v of this.vectors) {
      vertex(v.x + x - this.offset.x, v.y + y - this.offset.y);
    }
    endShape(CLOSE);
    image(this.image, x, y);
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
    let coll = imgobj instanceof  CollageImage
      ? this.imgs
      : this.outlined
    coll.push(imgobj)
  }

  clear () {
    this.imgs = []
  }
}
