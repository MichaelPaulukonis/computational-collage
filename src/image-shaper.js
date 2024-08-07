// originally @ https://editor.p5js.org/MichaelPaulukonis/sketches/cg_LK7asX

import * as JSZip from 'jszip'
import { sketch } from 'p5js-wrapper'

import saveAs from 'file-saver'
import Shape from './shape.js'

let sketch1 = new p5(p5 => {
  var imgOriginal
  var target

  p5.preload = () => {
    imgOriginal = p5.loadImage('/uploads/mona.dots.small.00.png')
  }

  p5.setup = () => {
    target = p5.createCanvas(800, 800)
    target.drop(handleFile)
    p5.imageMode(p5.CENTER)
    reset()
  }

  const handleFile = file => {
    if (file.type === 'image') {
      p5.loadImage(file.data, img => {
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

  let selectionShape = new Shape(p5)

  const reset = () => {
    p5.resizeCanvas(imgOriginal.width, imgOriginal.height)
    p5.image(imgOriginal, p5.width / 2, p5.height / 2)
    activity = activityModes.Selecting
    selectionShape = new Shape(p5)
  }

  const cropAndDisplay = () => {
    selectionShape.makeCutout(imgOriginal)
    activity = activityModes.Display
    p5.cursor()
    const { croppedImg, croppedVecs } = cropImageVecs(
      selectionShape.cutout,
      selectionShape.points
    )
    croppedVectors = croppedVecs
    p5.resizeCanvas(croppedImg.width, croppedImg.height)
    p5.clear()
    p5.image(croppedImg, p5.width / 2, p5.height / 2)
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
    let croppedImg = p5.createImage(right - left + 1, bottom - top + 1)
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
    let croppedVecs = points.map(v => p5.createVector(v.x - left, v.y - top))
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
    const name = `IMG_${p5.year()}-${p5.month()}-${p5.day()}_${p5.hour()}-${p5.minute()}-${p5.second()}`
    saver(target.drawingContext.canvas, croppedVectors, name)
    console.log('downloaded ' + name)
  }

  p5.mousePressed = () => {
    if (activity === activityModes.Selecting) {
      p5.noCursor()
      selectionShape.addVector(p5.mouseX, p5.mouseY)
    } else if (activity === activityModes.Editing) {
      selectionShape.handleMousePressed()
    }
  }

  p5.mouseDragged = () => {
    if (activity === activityModes.Editing) {
      selectionShape.handleMouseDragged()
    }
  }

  p5.mouseReleased = () => {
    if (activity === activityModes.Editing) {
      selectionShape.handleMouseReleased()
    }
  }

  p5.doubleClicked = () => {
    if (activity === activityModes.Selecting) {
      selectionShape.addVector(p5.mouseX, p5.mouseY)
      selectionShape.isOpen = false
      activity = activityModes.Editing
      p5.cursor()
    }
  }

  p5.keyPressed = () => {
    // mode invariant
    if (p5.key === 'R') {
      reset()
    }

    switch (activity) {
      case activityModes.Editing:
        if (p5.key === 'c') {
          cropAndDisplay()
        } else if (p5.key === 'r') {
          subMode =
            subMode === editSubModes.NONE
              ? editSubModes.ROTATE
              : editSubModes.NONE
          selectionShape.isRotating = subMode === editSubModes.ROTATE
        }
        break
      case activityModes.Display:
        if (p5.key === 's') {
          download()
        }
    }
  }

  p5.draw = () => {
    p5.cursor()
    if (activity === activityModes.Selecting) {
      p5.image(imgOriginal, p5.width / 2, p5.height / 2)
      selectionShape.draw({ x: p5.mouseX, y: p5.mouseY })
    } else if (activity === activityModes.Editing) {
      p5.image(imgOriginal, p5.width / 2, p5.height / 2)
      selectionShape.draw({ x: p5.mouseX, y: p5.mouseY })
      // if mouse is IN shape
      if (selectionShape.isPointInPolygon(p5.mouseX, p5.mouseY)) {
        p5.cursor('grab')
      }
      // if mouse is above a vector, highlight it
    }
  }
})
