// originally @ https://editor.p5js.org/MichaelPaulukonis/sketches/cg_LK7asX

import * as JSZip from 'jszip'
import { sketch } from 'p5js-wrapper'

import saveAs from 'file-saver'
import Shape from './shape.js'

let imgOriginal
let target

sketch.preload = () => {
  imgOriginal = sketch.loadImage('/uploads/mona.dots.small.00.png')
}

sketch.setup = () => {
  target = sketch.createCanvas(800, 800)
  target.drop(handleFile)
  sketch.imageMode(sketch.CENTER)
  reset()
}

const handleFile = file => {
  if (file.type === 'image') {
    sketch.loadImage(file.data, img => {
      imgOriginal = img
      reset()
    })
  } else {
    console.log('Not an image file or image-outline bundle!')
  }
}

const activityModes = {
  Editing: 'editing',
  Display: 'display',
  Selecting: 'selecting'
}
const editSubModes = {
  NONE: 'none',
  ROTATE: 'rotate'
}
let activity = activityModes.Selecting
let subMode = editSubModes.NONE
let croppedVectors = []

let selectionShape = new Shape(sketch)

const reset = () => {
  sketch.resizeCanvas(imgOriginal.width, imgOriginal.height)
  sketch.image(imgOriginal, sketch.width / 2, sketch.height / 2)
  activity = activityModes.Selecting
  selectionShape = new Shape(sketch)
}

const cropAndDisplay = () => {
  selectionShape.makeCutout(imgOriginal)
  activity = activityModes.Display
  sketch.cursor()
  const { croppedImg, croppedVecs } = cropImageVecs(
    selectionShape.cutout,
    selectionShape.points
  )
  croppedVectors = croppedVecs
  sketch.resizeCanvas(croppedImg.width, croppedImg.height)
  sketch.clear()
  sketch.image(croppedImg, sketch.width / 2, sketch.height / 2)
}

function cropImageVecs (img, points) {
  // use the shape vectors to get bounding box
  let left = img.width
  let right = 0
  let top = img.height
  let bottom = 0
  for (const v of points) {
    left = Math.min(left, v.x)
    right = Math.max(right, v.x)
    top = Math.min(top, v.y)
    bottom = Math.max(bottom, v.y)
  }
  // to guard against zero-width/height images?
  // do it right
  let croppedImg = sketch.createImage(right - left + 1, bottom - top + 1)
  croppedImg.copy(
    img,
    left,
    top,
    right - left + 1,
    bottom - top + 1,
    0,
    0,
    croppedImg.width,
    croppedImg.height
  )
  let croppedVecs = points.map(v => sketch.createVector(v.x - left, v.y - top))
  return { croppedImg, croppedVecs }
}

// zip containing image plus the vectors
const saver = (canvas, vectors, name) => {
  var zip = new JSZip()
  canvas.toBlob(blob => {
    zip.file(name + '.png', blob)
    zip.file(name + '.json', JSON.stringify(vectors))
    zip.generateAsync({ type: 'blob' }).then(content => {
      saveAs(content, `${name}.zip`)
    })
  })
}

function download () {
  const name = `IMG_${sketch.year()}-${sketch.month()}-${sketch.day()}_${sketch.hour()}-${sketch.minute()}-${sketch.second()}`
  saver(target.drawingContext.canvas, croppedVectors, name)
  console.log('downloaded ' + name)
}

sketch.mousePressed = () => {
  if (activity === activityModes.Selecting) {
    sketch.noCursor()
    selectionShape.addVector(sketch.mouseX, sketch.mouseY)
  } else if (activity === activityModes.Editing) {
    selectionShape.handleMousePressed()
  }
}

sketch.mouseDragged = () => {
  if (activity === activityModes.Editing) {
    selectionShape.handleMouseDragged()
  }
}

sketch.mouseReleased = () => {
  if (activity === activityModes.Editing) {
    selectionShape.handleMouseReleased()
  }
}

sketch.doubleClicked = () => {
  if (activity === activityModes.Selecting) {
    selectionShape.addVector(sketch.mouseX, sketch.mouseY)
    selectionShape.isOpen = false
    activity = activityModes.Editing
    sketch.cursor()
  }
}

sketch.keyPressed = () => {
  // mode invariant
  if (sketch.key === 'R') {
    reset()
  }

  switch (activity) {
    case activityModes.Editing:
      if (sketch.key === 'c') {
        cropAndDisplay()
      } else if (sketch.key === 'r') {
        subMode =
          subMode === editSubModes.NONE
            ? editSubModes.ROTATE
            : editSubModes.NONE
        selectionShape.isRotating = subMode === editSubModes.ROTATE
      }
      break
    case activityModes.Display:
      if (sketch.key === 's') {
        download()
      }
  }
}

sketch.draw = () => {
  sketch.cursor()
  if (activity === activityModes.Selecting) {
    sketch.image(imgOriginal, sketch.width / 2, sketch.height / 2)
    selectionShape.draw({ x: sketch.mouseX, y: sketch.mouseY })
  } else if (activity === activityModes.Editing) {
    sketch.image(imgOriginal, sketch.width / 2, sketch.height / 2)
    selectionShape.draw({ x: sketch.mouseX, y: sketch.mouseY })
    // if mouse is IN shape
    if (selectionShape.isPointInPolygon(sketch.mouseX, sketch.mouseY)) {
      sketch.cursor('grab')
    }
    // if mouse is above a vector, highlight it
  }
}
