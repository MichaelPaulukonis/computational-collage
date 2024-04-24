import saveAs from 'file-saver'
import '../css/collage.style.css'
import { Pane } from 'tweakpane'
import { sketch } from 'p5js-wrapper'
import 'p5js-wrapper/sound'
import { datestring, filenamer } from './filelib'
import { CollageImage, Images } from './images'

const sounds = [] // array for sound effects
let actionSound // Sound for actions inclu save, blend & clear uploads
let images = [] // array for source images
let cimages = new Images()
const userUploads = [] // buffer array for storing user uploads
let isUploads = false // Initial boolean value of user load status
let isHorizontal = true // Initial boolean value of pattern direction
let isBlended = false // Initial bool value of the image blending status
let img // singel image buffer
let probFactor = 0.7 // mondrian division probability factor
let thickness = 0 // mondrian grid thickness
let displayCanvas // canvas
let mondrianProb = 1.2

const config = {
  mondrianStripes: true,
  mondrianTileSize: 400,
  lastMode: null,
  stripeSize: 1,
  outline: true,
  circle: false,
  outlineWeight: 50,
  stripMin: 100,
  stripMax: 1000,
  stripCount: 100,
  probFactor: 0.7,
  thickness: 0,
  mondrianProb: 1.2,
  mondrianProbFactor: 0.7,
  cropStrategy: 'CENTER'
}
let uploadBtn, downloadBtn, clearBtn, blendBtn, resetBtn
let namer = filenamer(datestring())
const modes = [
  [mode0, 'Image gallery'],
  [mode1, 'Full-length strips'],
  [mode2, 'Collaging random chunks'],
  [mode3, 'Regular grid of stretched pixels'],
  [mode4, 'Floating pixels'],
  [mode5, 'Floating rounded rectangular splashes'],
  [mode6, 'Horizontal free strips'],
  [mode7, 'Mondrian stripes'],
  [mode8, 'Horizontally stretched'],
  [mode9, 'Concentric circle splashes']
]

const cropStrategies = [
  'CENTER', 'TOP-LEFT', 'BOTTOM-RIGHT', 'RANDOM'
]

let target // graphics object at full size
const pane = new Pane()

sketch.preload = () => {
  // Load consistently-named images into an array
  for (let i = 0; i < 6; i++) {
    images[i] = loadImage('uploads/trees' + i + '.jpg')
  }

  // Load sounds: Sound from Zapsplat.com
  for (let i = 0; i < 4; i++) {
    sounds[i] = loadSound('uploads/sound' + i + '.mp3')
  }

  actionSound = loadSound('uploads/glassy0.mp3')
}

sketch.setup = () => {
  displayCanvas = createCanvas(500, 500)
  displayCanvas.drop(handleFile)
  target = createGraphics(1000, 1000)

  setupButtons()

  pane.addBinding(config, 'mondrianStripes')
  pane.addBinding(config, 'mondrianTileSize', { min: 100, max: 1000, step: 50 })
  pane.addBinding(config, 'stripeSize', { min: 1, max: 50, step: 1})
  pane.addBinding(config, 'mondrianProb', { min: 0.05, max: 2, step: 0.05})
  pane.addBinding(config, 'probFactor', { min: 0.1, max: 0.95, step: 0.05})

  pane.addBinding(config, 'outline')
  pane.addBinding(config, 'circle')
  pane.addBinding(config, 'outlineWeight', { min: 1, max: 200, step: 1})  
  pane.addBinding(config, 'stripMin', { min: 50, max: 900, step: 25})
  pane.addBinding(config, 'stripMax', { min: 100, max: 1000, step: 25})
  pane.addBinding(config, 'stripCount', { min: 1, max: 200, step: 1})
  pane.addBlade({
    view: 'list',
    label: 'cropping',
    options: cropStrategies.map(strat => ({ text: strat, value: strat })),
    value: cropStrategies[0]
  }).on('change', ({ value }) => {
    config.cropStrategy = value
  })

  for (let i = 0, n = images.length; i < n; i++) {
    let croppedImg = squareCrop(images[i])
    croppedImg.resize(target.width, 0)
    cimages.addImage(new CollageImage(images[i], croppedImg))
  }

  noLoop()
}

const squareCrop = img => {
  const w = img.width
  const h = img.height
  let min = Math.min(w, h)
  let x, y

  switch (config.cropStrategy) {
    case 'CENTER':
      x = (w - min) / 2
      y = (h - min) / 2
      break
    case 'TOP-LEFT':
      x = 0
      y = 0
      break
    case 'BOTTOM-RIGHT':
      x = w - min
      y = h - min
      break
    case 'RANDOM':
      if (min > 500) {
        min = min - random(0, min - 500)
      }
      x = random(0, w - min)
      y = random(0, h - min)
      break
    }

  return img.get(x, y, min, min)
}

function setupButtons () {
  const btnX = 20
  let btnYStart = 160
  const btnYStep = 40
  const white = color(255)
  const dark = color(30)
  const blackTrans = color(0, 0, 0, 80)

  // Upload button
  uploadBtn = createButton('upload')
  uploadBtn.mousePressed(dropFiles)
  uploadBtn.position(btnX, btnYStart)
  uploadBtn.style('background-color', dark)
  uploadBtn.style('color', white)
  uploadBtn.style('border', '1px')
  uploadBtn.style('border', dark)
  uploadBtn.style('width', '60px')
  uploadBtn.style('padding-top', '3px')
  uploadBtn.style('padding-bottom', '3px')

  // Clear uploads button
  clearBtn = createButton('clear')
  clearBtn.position(btnX, btnYStart)
  clearBtn.mousePressed(clearUploads)
  clearBtn.style('background-color', dark)
  clearBtn.style('color', white)
  clearBtn.style('border', '1px')
  clearBtn.style('border', dark)
  clearBtn.style('width', '60px')
  clearBtn.style('padding-top', '3px')
  clearBtn.style('padding-bottom', '3px')
  clearBtn.hide()

  // Download button
  downloadBtn = createButton('save')
  downloadBtn.mousePressed(download)
  downloadBtn.position(btnX, (btnYStart += btnYStep))
  downloadBtn.style('background-color', dark)
  downloadBtn.style('color', white)
  downloadBtn.style('border', '1px')
  downloadBtn.style('border', dark)
  downloadBtn.style('width', '60px')
  downloadBtn.style('padding-top', '3px')
  downloadBtn.style('padding-bottom', '3px')

  // A list of mode buttons
  for (let n = 0; n < 10; n++) {
    let modeBtn
    if (n === 0) {
      modeBtn = createButton('original')
    } else {
      modeBtn = createButton('mode ' + n)
    }
    modeBtn.elt.title = modes[n].length > 1 ? modes[n][1] : `Mode ${n}`

    modeBtn.mousePressed(modes[n][0])
    modeBtn.position(btnX, btnYStart + btnYStep * (n + 1))
    // TODO: move into css
    modeBtn.style('background-color', blackTrans)
    modeBtn.style('color', white)
    modeBtn.style('border', '1px solid white')
    modeBtn.style('width', '60px')
    modeBtn.style('padding-top', '3px')
    modeBtn.style('padding-bottom', '3px')
  }

  // Blend mode button
  blendBtn = createButton('blend')
  blendBtn.mousePressed(blendLightest)
  blendBtn.position(btnX, btnYStart + btnYStep * 11) // sub-optimal
  blendBtn.style('background-color', blackTrans)
  blendBtn.style('color', white)
  blendBtn.style('border', 'none')
  blendBtn.style('padding-top', '3px')
  blendBtn.style('padding-bottom', '3px')

  // Reset blend mode button
  resetBtn = createButton('clear blend')
  resetBtn.mousePressed(resetBlend)
  resetBtn.position(btnX, btnYStart + btnYStep * 11)
  resetBtn.style('background-color', blackTrans)
  resetBtn.style('color', white)
  resetBtn.style('border', 'none')
  resetBtn.style('padding-top', '3px')
  resetBtn.style('padding-bottom', '3px')
  resetBtn.hide()
}

sketch.draw = () => {
  background(0)

  // Check if user has supplied photos
  if (isUploads) {
    uploadBtn.hide()
    clearBtn.show()
  }

  mode0()
  random(sounds).play()
}

sketch.keyTyped = () => {
  if (key === 's') {
    download()
  } else if (key === 'a') {
    config.circle = !config.circle
  } else if (key === 'b') {
    blendLightest()
  } else if (key === 'r') {
    resetBlend()
  } else if (key === 'c') {
    clearUploads()
    namer = filenamer(datestring())
  } else if (key === 'd') {
    duplicateRecrop()
  } else if (key === 'u') {
    dropFiles()
  } else if (key === 'o') {
    config.outline = !config.outline
  } else if (key === 'h') {
    isHorizontal = !isHorizontal
  } else if (key === 'p') {
    probFactor = +((probFactor - 0.1 + 0.9) % 0.9).toFixed(1)
    probFactor = probFactor === 0 ? 0.9 : probFactor
  } else if (key === 't') {
    thickness = (thickness + 1) % 20
  } else if (key === 'm') {
    config.mondrianStripes = !config.mondrianStripes
    actionSound.play()
  } else if (key === 'n') {
    config.stripeSize += 1 % 20
  } else if (key === 'l') {
    mondrianProb = (mondrianProb + 0.1) % 1
  } else if (key === 'z') {
    config.mondrianTileSize = ((config.mondrianTileSize + 25) % 1000) + 25
    console.log(config.mondrianTileSize)
  } else if ('0123456789'.includes(key)) {
    modes[key][0]()
  } else if (key === '`') {
    if (config.lastMode === null) return false
    frameRate(5)
    for (let i = 0; i < 30; i++) {
      config.lastMode()
      // repeated saves don't work so well - I get 18/20 or worse.
      // I "solved" this problem by using a custom library - see polychrometext
      // except it still doesn't work, here. Something else must have come into play.
      download()
      console.log(`saved collage ${i}`)
    }
  }
  return false
}

function dropFiles () {
  fill(60)
  noStroke()
  rect(0, 0, displayCanvas.width, displayCanvas.height)

  fill(255)
  textSize(24)
  textAlign(CENTER)
  text(
    'Drag image files onto the canvas.',
    displayCanvas.width / 2,
    displayCanvas.height / 2
  )
}

// Handle file uploads
function handleFile (file) {
  if (file.type === 'image') {
    isUploads = true
    loadImage(file.data, img => {
      let croppedImg = squareCrop(img)
      croppedImg.resize(target.width, 0)
      cimages.addImage(new CollageImage(img, croppedImg))
      sketch.draw()
    })
  } else {
    console.log('Not an image file!')
  }
}

const duplicateRecrop = () => {
  const tempCropMode = config.cropStrategy
  config.cropStrategy = 'RANDOM'
  const cloned = cimages.images[cimages.images.length - 1].clone
  cloned.cropped = squareCrop(cloned.original)
  cloned.cropped.resize(target.width, 0)
  cimages.addImage(cloned)
  config.cropStrategy = tempCropMode
  mode0()
}

// Clear upload files
function clearUploads () {
  userUploads.length = 0
  cimages.clear()
  isUploads = false
  clearBtn.hide()
  uploadBtn.show()
  actionSound.play()
  dropFiles()
}

const saver = (canvas, name) => {
  canvas.toBlob(blob => saveAs(blob, name))
}

// Download current canvas
function download () {
  // actionSound.play();
  const name = namer() + '.png'
  saver(target.drawingContext.canvas, name)
  console.log('downloaded ' + name)
}

// Show input image gallery (no more than 9 for speed)
function mode0 () {
  config.lastMode = mode0
  const tileCountX = 3
  const tileCountY = 3

  const tileWidth = displayCanvas.width / tileCountX
  const tileHeight = displayCanvas.height / tileCountY

  let i = 0
  for (let gridY = 0; gridY < tileCountY; gridY++) {
    for (let gridX = 0; gridX < tileCountX; gridX++) {
      const tmp = cimages.images[i].cropped.get()
      tmp.resize(0, tileHeight)
      image(tmp, gridX * tileWidth, gridY * tileHeight)
      i = (i + 1) % cimages.images.length
    }
  }

  sounds[0].play()
}

// Full-length strips
function mode1 () {
  config.lastMode = mode1
  if (isHorizontal) {
    for (let y = 0; y < target.height; y += 10) {
      img = cimages.random.cropped

      // pick a y point to get the strip
      const stripYPosition = int(random(0, img.height - 10))

      // use get() to extract a strip of the image
      const strip = img.get(0, stripYPosition, img.width, 10)

      target.image(strip, 0, y)
    }
    isHorizontal = false
  } else {
    // Toggle to vertical
    for (let x = 0; x < target.width; x += 10) {
      cimages.random.cropped

      // pick a x point to get the strip
      const stripXPosition = int(random(0, img.width - 10))

      // use get() to extract a strip of the image
      const strip = img.get(stripXPosition, 0, 10, img.width)
      target.image(strip, x, 0)
    }
    isHorizontal = true
  }
  // TODO: need a better solution
  image(target, 0, 0, displayCanvas.width, displayCanvas.height)
  random(sounds).play()
}

// Collaging random chunks
// NOTE: circle mode ignores the upper left
// it would have to select areas "outside" the box to not ignore it
// Do I have this problem in the other app?
function mode2 () {
  config.lastMode = mode2

  target.image(cimages.random.cropped, 0, 0)
  if (config.outline) {
    // target.blendMode('source-over')
    target.strokeWeight(config.outlineWeight)
    target.stroke('black')
    target.noFill()
  }

  for (let i = 0; i < config.stripCount; i++) {
    img = cimages.random.cropped
    const stripW = random(config.stripMin, config.stripMax)
    const stripH = random(config.stripMin, config.stripMax)
    const stripX = random(stripW / -2, img.width)
    const stripY = random(stripH / -2, img.height)
    const strip = img.get(stripX, stripY, stripW, stripH)

    if (config.circle) {
      let customMask = createGraphics(stripW, stripH)
      customMask.noStroke()
      customMask.fill(255)
      customMask.circle(stripW / 2, stripH / 2, Math.min(stripH, stripW))
      strip.mask(customMask)
      customMask.remove()
      target.circle(
        stripX + stripW / 2,
        stripY + stripH / 2,
        Math.min(stripH, stripW)
      )
    } else {
      target.rect(stripX, stripY, stripW, stripH)
    }
    target.image(strip, stripX, stripY)
  }

  if (config.outline) {
    target.rect(0, 0, target.width, target.height)
  }
  // filter(ERODE);
  // filter(THRESHOLD, 0.4);
  target.strokeWeight(0)

  target.filter(DILATE)
  image(target, 0, 0, displayCanvas.width, displayCanvas.height)
  random(sounds).play()
}

// Regular grid of stretched pixels
function mode3 () {
  config.lastMode = mode3

  target.noStroke()
  const tileHeight = 20
  const tileWidth = random(20, 50)

  const tileCountY = target.height / tileHeight
  const tileCountX = target.width / tileWidth

  for (let gridY = 0; gridY < tileCountY; gridY++) {
    for (let gridX = 0; gridX < tileCountX; gridX++) {
      img = cimages.random.cropped

      for (let j = 0; j < tileHeight; j++) {
        const c = img.get(gridX * tileWidth, gridY * tileHeight + j)
        target.fill(c)
        target.rect(gridX * tileWidth, gridY * tileHeight + j, tileWidth, 1)
      }
    }
  }
  image(target, 0, 0, displayCanvas.width, displayCanvas.height)
  random(sounds).play()
}

// Floating pixels
function mode4 () {
  config.lastMode = mode4
  target.fill(0)
  target.rect(0, 0, target.width, target.height)
  target.noStroke()
  for (let i = 0; i < 900; i++) {
    img = cimages.random.cropped

    const stripX = random(img.width)
    const stripY = random(img.height)
    const stripW = random(40, 50)
    const stripH = random(40, 50)
    if (random(0, 1) > 0.3) {
      const c = img.get(stripX, stripY)
      target.fill(c)
      target.rect(stripX, stripY, stripW, stripH)
    } else {
      const strip = img.get(stripX, stripY, stripW, stripH)
      target.image(strip, stripX, stripY)
    }
  }
  image(target, 0, 0, displayCanvas.width, displayCanvas.height)
  random(sounds).play()
}

// Floating rounded rectangular splashes
function mode5 () {
  config.lastMode = mode5
  target.noStroke()
  img = cimages.random.cropped

  const c = img.get(target.width / 2, target.height / 2)
  target.fill(c)
  target.rect(0, 0, target.width, target.height)

  for (let i = 0; i < 1500; i++) {
    img = cimages.random.cropped

    const stripX = random(img.width)
    const stripY = random(img.height)
    const stripW = random(5, 30)
    const stripH = random(5, 30)

    const c = img.get(stripX, stripY)
    target.fill(c)
    target.rect(stripX, stripY, stripW, stripH, 5)
  }
  image(target, 0, 0, displayCanvas.width, displayCanvas.height)
  random(sounds).play()
}

// Horizontal free strips
function mode6 () {
  config.lastMode = mode6
  target.noStroke()
  const tileHeight = 5
  const tileCountY = target.height / tileHeight

  for (let gridY = 0; gridY < tileCountY; gridY++) {
    let x = 0
    while (x < target.width) {
      const tileWidth = random(15, 40)
      const y = gridY * tileHeight
      img = cimages.random.cropped

      // Base grid tile
      target.rect(x, y, tileWidth, tileHeight)

      if (random(0, 1) > 0.7) {
        const c = img.get(x, gridY * tileHeight)
        target.fill(c)
        target.rect(
          random(x - 10, x + 10),
          random(y - 10, y + 10),
          tileWidth,
          tileHeight
        )
      } else {
        // Offset tile
        const strip = img.get(x, y, tileWidth, tileHeight)
        target.image(strip, random(x - 10, x + 10), random(y - 10, y + 10))
      }

      x += tileWidth
    }
  }
  image(target, 0, 0, displayCanvas.width, displayCanvas.height)
  random(sounds).play()
}

let counter = 0
// Mondrian stripes
function mode7 () {
  config.lastMode = mode7
  target.noStroke()
  counter = 0
  mondrian(
    target.width - thickness,
    target.height - thickness,
    thickness / 2,
    thickness / 2,
    config.mondrianProb,
    random(2) < 1
  )
  // target.filter(DILATE);
  console.log(`called Mondrian ${counter} times`)
  image(target, 0, 0, displayCanvas.width, displayCanvas.height)
  random(sounds).play()
}

// Horizontally stretched
function mode8 () {
  config.lastMode = mode8
  target.noStroke()
  const backGrnd = cimages.random.cropped

  for (let j = 0; j < target.height; j += 5) {
    const c = backGrnd.get(target.width / 2, j)
    target.fill(c)
    target.rect(0, j, target.width, 5)
  }

  for (let i = 0; i < 200; i++) {
    img = cimages.random.cropped

    const stripX = random(img.width)
    const stripY = random(img.height)
    const stripW = random(50, 150)
    const stripH = random(50, 150)

    for (let j = 0; j < stripH; j++) {
      const c = img.get(stripX, stripY + j)
      target.fill(c)
      target.rect(stripX, stripY + j, stripW, 1)
    }
  }
  target.filter(DILATE)
  image(target, 0, 0, displayCanvas.width, displayCanvas.height)
  random(sounds).play()
}

// Concentric circle splashes
function mode9 () {
  config.lastMode = mode9
  target.fill(0)
  target.noStroke()
  target.rect(0, 0, target.width, target.height)
  target.noFill()
  target.blendMode(LIGHTEST)

  for (let i = 0; i < 450; i++) {
    img = cimages.random.cropped

    const X = random(target.width)
    const Y = random(target.height)
    const R = random(5, 200)
    const interval = int(random(4, 10))
    const numColors = int(random(1, 3))
    target.strokeWeight(int(random(1, 3)))

    // Color palette
    const colors = []
    for (let n = 0; n < numColors; n++) {
      colors[n] = img.get(
        min(target.width - 2, X + 2 * n),
        min(target.height - 2, Y + 2 * n)
      )
    }

    let cIndex = 0

    // Draw con-centric circles
    for (let r = 0; r < R; r += interval) {
      target.stroke(colors[cIndex])
      target.circle(X, Y, r)

      if (cIndex === numColors - 1) {
        cIndex = 0
      } else {
        cIndex++
      }
    }
  }
  if (!isBlended) {
    target.blendMode(BLEND)
  }
  image(target, 0, 0, displayCanvas.width, displayCanvas.height)

  sounds[3].play()
}

const factor = {
  low: 0.3,
  high: 0.7
}

// wrapper
function mondrian (w, h, x, y, prob, vertical) {

  mondrianInner(w, h, x, y, prob, vertical)

  if (config.outline) {
    target.noFill()
    target.strokeWeight(config.outlineWeight)
    target.stroke('black')
    target.rect(0, 0, target.width, target.height)
    target.strokeWeight(0)
  }
}

// Draw mondrian-style grid of collages
// may have originally been based on https://github.com/ronikaufman/mondrian_generator/blob/master/mondrian_generator.pde
// might be interesting to follow-up with some circles
// positioned on lines and intersections
// but we'd have to have knowledge of where lines had been drawn....
function mondrianInner (w, h, x, y, prob, vertical) {
  counter++
  // Recursion calls: Divide againv
  const coinFlip = random(1) < prob
  if (coinFlip) {
    if (vertical) {
      const wDivision = floor(random(w * factor.low, w * factor.high))
      mondrianInner(wDivision, h, x, y, prob * config.mondrianProbFactor, false)
      mondrianInner(w - wDivision, h, x + wDivision, y, prob * config.mondrianProbFactor, false)
    } else {
      const hDivision = floor(random(h * factor.low, h * factor.high))
      mondrianInner(w, hDivision, x, y, prob * config.mondrianProbFactor, true)
      mondrianInner(w, h - hDivision, x, y + hDivision, prob * config.mondrianProbFactor, true)
    }
  } else {
    // Base case: Draw rectangle
    img = cimages.random.cropped
    const tileHeight = max(h - thickness, 0)
    const tileWidth = max(w - thickness, 0)
    if (config.outline) {
      target.stroke('black')
      target.strokeWeight(config.outlineWeight)
      target.noFill()
      target.rect(x, y, tileWidth, tileHeight)
    }
    target.strokeWeight(0)
    if (
      config.mondrianStripes &&
      (tileWidth > config.mondrianTileSize ||
        tileHeight > config.mondrianTileSize)
    ) {
      // Draw horizontal stripes
      if (random(1) > 0.5) {
        for (let j = 0; j < tileHeight; j += config.stripeSize) {
          const c = img.get(x + thickness / 2, y + thickness / 2 + j)
          target.fill(c)
          target.rect(
            x + thickness / 2,
            y + thickness / 2 + j,
            tileWidth,
            config.stripeSize
          )
        }
      } else {
        // Draw vertical strips
        for (let j = 0; j < tileWidth; j += config.stripeSize) {
          const c = img.get(x + thickness / 2 + j, y + thickness / 2)
          target.fill(c)
          target.rect(
            x + thickness / 2 + j,
            y + thickness / 2,
            config.stripeSize,
            tileHeight
          )
        }
      }
    } else {
      const strip = img.get(
        x + thickness / 2,
        y + thickness / 2,
        tileWidth,
        tileHeight
      )
      if (tileHeight !== 0 && tileWidth !== 0) {
        target.rect(x + thickness / 2, y + thickness / 2, tileWidth, tileHeight)
        target.image(strip, x + thickness / 2, y + thickness / 2)
      }
    }
  }
}

// Reset default blend mode
function resetBlend () {
  target.blendMode(BLEND)
  isBlended = false
  resetBtn.hide()
  blendBtn.show()
  actionSound.play()
}

// Set to Lightest image blend mode
function blendLightest () {
  target.blendMode(LIGHTEST)
  isBlended = true
  resetBtn.show()
  blendBtn.hide()
  actionSound.play()
}
