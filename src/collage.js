import saveAs from 'file-saver'
import '../css/collage.style.css'
import { Pane } from 'tweakpane'
import { sketch } from 'p5js-wrapper'
import 'p5js-wrapper/sound'
import './p5.pattern.js'
import { PTN } from './p5.pattern.js'
import { datestring, filenamer } from './filelib'
import { CollageImage, Images } from './images'

const sounds = [] // array for sound effects
let actionSound // Sound for actions inclu save, blend & clear uploads
let images = [] // array for source images
let cimages = new Images()
let patternImages = []
let solids = []
const userUploads = [] // buffer array for storing user uploads
let isHorizontal = true // Initial boolean value of pattern direction
let isBlended = false // Initial bool value of the image blending status
let img // single image buffer
let displayCanvas // canvas

let COLS = createCols('https://coolors.co/bcf8ec-aed9e0-9fa0c3-8b687f-7b435b')

const activityModes = {
  Drawing: 'draw',
  Gallery: 'gallery'
}
let activity = activityModes.Drawing

let addins = {
  Pattern: 'pattern',
  Solid: 'solid'
}

const cropStrategies = ['CENTER', 'TOP-LEFT', 'BOTTOM-RIGHT', 'RANDOM']
const fragmentStrategies = {
  LOCATION_FRAGMENT: 'location',
  FULL_CENTERED: 'fullcenter',
  RANDOM: 'random'
}

const config = {
  addin: addins.Solid,
  mondrianStripes: true,
  mondrianTileSize: 400,
  currentMode: null,
  stripeSize: 1,
  outline: true,
  circle: false,
  outlineWeight: 50,
  stripMin: 100,
  stripMax: 1000,
  stripCount: 100,
  mondrianProb: 1.2,
  mondrianProbFactor: 0.7,
  cropStrategy: 'CENTER',
  solidProb: 0.8,
  fragmentStrategy: fragmentStrategies.RANDOM,
  patternsReady: false,
  selectedIndex: 0
}
let uploadBtn, downloadBtn, clearBtn, blendBtn, resetBtn
let namer = filenamer(datestring())
const modes = [
  [mode0, 'Image gallery'],
  [mode1, 'Full-length strips'],
  [mode2, 'Collaging random chunks'],
  [mode3, 'Circular arrangements'],
  [mode4, 'Floating pixels'],
  [mode5, 'Mondrian boxes'],
  [mode6, 'Horizontal free strips'],
  [mode7, 'Mondrian stripes'],
  [mode8, 'Horizontally stretched'],
  [mode9, 'Concentric circle splashes']
]

let target // graphics object at full size
const pane = new Pane()

sketch.preload = () => {
  // Load consistently-named images into an array
  for (let i = 0; i < 6; i++) {
    images[i] = loadImage('./uploads/trees' + i + '.jpg')
  }
  console.log('images loaded')

  // Load sounds: Sound from Zapsplat.com
  for (let i = 0; i < 4; i++) {
    sounds[i] = loadSound('./uploads/sound' + i + '.mp3')
  }

  actionSound = loadSound('./uploads/glassy0.mp3')
  console.log('sounds loaded')
}

sketch.setup = () => {
  displayCanvas = createCanvas(500, 500)
  displayCanvas.drop(handleFile)
  target = createGraphics(1000, 1000)
  makeSolids()

  setupButtons()

  const tab = pane.addTab({
    pages: [{ title: 'Parameters' }, { title: 'Collage Modes' }]
  })
  const parmTab = tab.pages[0]
  const modeTab = tab.pages[1]

  const btn = parmTab
    .addButton({
      title: 'Patterns',
      label: 'load' // optional
    })
    .on('click', () => makePatterns())
  parmTab.addBinding(config, 'addin', {
    options: addins
  })
  parmTab
    .addButton({
      title: 'Load solids',
      label: ''
    })
    .on('click', () => getColorSolids())
  parmTab.addBinding(config, 'mondrianStripes')
  parmTab.addBinding(config, 'mondrianTileSize', {
    min: 100,
    max: 1000,
    step: 50
  })
  parmTab.addBinding(config, 'stripeSize', { min: 1, max: 50, step: 1 })
  parmTab.addBinding(config, 'mondrianProb', { min: 0.05, max: 2, step: 0.05 })
  parmTab.addBinding(config, 'mondrianProbFactor', {
    min: 0.1,
    max: 0.95,
    step: 0.05
  })

  parmTab.addBinding(config, 'outline')
  parmTab.addBinding(config, 'circle')
  parmTab.addBinding(config, 'outlineWeight', { min: 1, max: 200, step: 1 })
  parmTab.addBinding(config, 'stripMin', { min: 50, max: 900, step: 25 })
  parmTab.addBinding(config, 'stripMax', { min: 100, max: 1000, step: 25 })
  parmTab.addBinding(config, 'stripCount', { min: 1, max: 200, step: 1 })
  parmTab.addBinding(config, 'solidProb', { min: 0, max: 1, step: 0.1 })
  parmTab
    .addBlade({
      view: 'list',
      label: 'cropping',
      options: cropStrategies.map(strat => ({ text: strat, value: strat })),
      value: cropStrategies[0]
    })
    .on('change', ({ value }) => {
      config.cropStrategy = value
    })
  parmTab.addBinding(config, 'fragmentStrategy', {
    options: fragmentStrategies
  })

  modes.forEach(m =>
    modeTab
      .addButton({
        title: m[1]
      })
      .on('click', () => m[0]())
  )

  for (let i = 0, n = images.length; i < n; i++) {
    let croppedImg = squareCrop(images[i])
    croppedImg.resize(target.width, 0)
    cimages.addImage(new CollageImage(images[i], croppedImg))
  }

  background(0)

  displayGallery()
  random(sounds).play()
}

function randPattern (t) {
  const ptArr = [
    PTN.noise(0.5),
    PTN.noiseGrad(0.4),
    PTN.stripe(t / int(random(6, 12))),
    PTN.stripeCircle(t / int(random(6, 12))),
    PTN.stripePolygon(int(random(3, 7)), int(random(6, 12))),
    PTN.stripeRadial(TAU / int(random(6, 30))),
    PTN.wave(t / int(random(1, 3)), t / int(random(10, 20)), t / 5, t / 10),
    PTN.dot(t / 10, (t / 10) * random(0.2, 1)),
    PTN.checked(t / int(random(5, 20)), t / int(random(5, 20))),
    PTN.cross(t / int(random(10, 20)), t / int(random(20, 40))),
    PTN.triangle(t / int(random(5, 20)), t / int(random(5, 20)))
  ]
  return random(ptArr)
}

const getColorSolids = () => {
  const img = cimages.images[config.selectedIndex].original
  const colors = getDominantColors(img, 5, 30)
  makeSolids(colors)
}

const makeSolids = (colors = null) => {
  colors = colors
    ? colors
    : ['tomato', 'powderblue', 'yellowgreen', 'white', 'salmon', 'turquoise']
  let temp = createGraphics(500, 500)

  solids = colors.map(color => {
    temp.background(color)
    let img = createImage(2000, 2000)
    img.copy(temp, 0, 0, 500, 500, 0, 0, 2000, 2000)
    return img
  })
  temp.remove()
}

const makePatterns = () => {
  let pats = []
  let temp = createGraphics(500, 500)
  const palette = shuffle(COLS, true)

  const xSpan = 500
  const ySpan = 500
  for (let i = 0; i < 10; i++) {
    temp.patternColors(shuffle(palette))
    temp.pattern(randPattern(100))
    temp.patternAngle((int(random(4)) * PI) / 4)
    temp.push()
    // temp.rotate(isDraw * HALF_PI);

    const rn = random()
    if (rn > 0.66) temp.rectPattern(0, 0, xSpan, ySpan, xSpan, 0, 0, 0)
    else if (rn > 0.33)
      temp.arcPattern(
        xSpan / 2,
        ySpan / 2,
        xSpan * 2,
        ySpan * 2,
        PI,
        (TAU / 4) * 3
      )
    else
      temp.trianglePattern(
        xSpan / 2,
        ySpan / 2,
        -xSpan / 2,
        ySpan / 2,
        xSpan / 2,
        -ySpan / 2
      )

    let img = createImage(2000, 2000)
    img.copy(temp, 0, 0, 500, 500, 0, 0, img.width, img.height)
    console.log(`created pattern ${i + 1}`)
    pats.push(img)
    temp.pop()
  }

  temp.remove()
  patternImages = pats
  config.patternsReady = true
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
      modeBtn = createButton('gallery')
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
  if (activity === activityModes.Gallery) {
  }
}

const mouseWithinCanvas = () => {
  return (
    mouseX >= 0 &&
    mouseX <= displayCanvas.width &&
    mouseY >= 0 &&
    mouseY <= displayCanvas.height
  )
}

// this is START of press
sketch.mousePressed = () => {
  if (activity === activityModes.Gallery && mouseWithinCanvas()) {
    const tileSize = displayCanvas.width / 3
    let clickedIndex = floor(mouseX / tileSize) + floor(mouseY / tileSize) * 3
    if (clickedIndex < cimages.images.length) {
      config.selectedIndex = clickedIndex
    }
    displayGallery()
  }
}

sketch.keyTyped = () => {
  // perform action invariant of activity
  if ('0123456789'.includes(key)) {
    modes[key][0]()
  } else if (activity === activityModes.Gallery) {
    if (key === 'x') {
      deleteImage(config.selectedIndex)
    } else if (key === 'c') {
      clearUploads()
      namer = filenamer(datestring())
    }
  } else {
    if (key === 's') {
      download()
    } else if (key === 'a') {
      config.circle = !config.circle
    } else if (key === 'b') {
      blendLightest()
    } else if (key === 'r') {
      resetBlend()
    } else if (key === 'd') {
      duplicateRecrop()
    } else if (key === 'g') {
      displayGallery()
    } else if (key === 'u') {
      dropFiles()
    } else if (key === 'o') {
      config.outline = !config.outline
    } else if (key === 'h') {
      isHorizontal = !isHorizontal
    } else if (key === 'p') {
      config.mondrianProbFactor = +(
        (config.mondrianProbFactor - 0.1 + 0.9) %
        0.9
      ).toFixed(1)
      config.mondrianProbFactor =
        config.mondrianProbFactor === 0 ? 0.9 : config.mondrianProbFactor
    } else if (key === 'm') {
      config.mondrianStripes = !config.mondrianStripes
      actionSound.play()
    } else if (key === 'n') {
      config.stripeSize += 1 % 20
    } else if (key === 'l') {
      config.mondrianProb = (config.mondrianProb + 0.1) % 1
    } else if (key === 'z') {
      config.mondrianTileSize = ((config.mondrianTileSize + 25) % 1000) + 25
      console.log(config.mondrianTileSize)
    } else if (key === '`') {
      if (config.currentMode === null) return false
      frameRate(5)
      for (let i = 0; i < 30; i++) {
        config.currentMode()
        // repeated saves don't work so well - I get 18/20 or worse.
        // I "solved" this problem by using a custom library - see polychrometext
        // except it still doesn't work, here. Something else must have come into play.
        download()
        console.log(`saved collage ${i}`)
      }
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
    loadImage(file.data, img => {
      let croppedImg = squareCrop(img)
      croppedImg.resize(target.width, 0)
      cimages.addImage(new CollageImage(img, croppedImg))
      displayGallery()
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
  displayGallery()
}

// Clear upload files
function clearUploads () {
  userUploads.length = 0
  cimages.clear()
  clearBtn.hide()
  uploadBtn.show()
  actionSound.play()
  dropFiles()
}

const saver = (canvas, name) => {
  canvas.toBlob(blob => saveAs(blob, name))
}

function download () {
  // actionSound.play();
  const name = namer() + '.png'
  saver(target.drawingContext.canvas, name)
  console.log('downloaded ' + name)
}

// Show input image gallery (no more than 9 for speed)
const displayGallery = () => {
  activity = activityModes.Gallery
  config.currentMode = mode0
  const tileCountX = 3
  const tileCountY = 3

  const tileWidth = displayCanvas.width / tileCountX
  const tileHeight = displayCanvas.height / tileCountY
  background(60)
  noStroke()
  textSize(12)
  textAlign(CENTER)

  let i = 0
  for (let gridY = 0; gridY < tileCountY; gridY++) {
    for (let gridX = 0; gridX < tileCountX; gridX++) {
      if (i >= cimages.images.length) {
        fill(255)
        text(
          'Drop to upload',
          gridX * tileWidth + tileWidth / 2,
          gridY * tileHeight + tileHeight / 2
        )
      } else {
        const tmp = cimages.images[i].cropped.get()
        tmp.resize(0, tileHeight)
        image(tmp, gridX * tileWidth, gridY * tileHeight)

        if (config.selectedIndex === i) {
          noFill()
          stroke('green')
          strokeWeight(4)
          rect(gridX * tileWidth, gridY * tileHeight, tileWidth, tileWidth)
          displayCanvas.fill('black')
          noStroke()
        }
      }
      i++
    }
  }
}

// Show input image gallery (no more than 9 for speed)
const displayGallery_other = () => {
  const tileCountX = 3
  const tileCountY = 3

  const tileWidth = cnvs.width / tileCountX
  const tileHeight = cnvs.height / tileCountY
  background('white')
  fill('black')
  noStroke()

  let i = 0
  for (let gridY = 0; gridY < tileCountY; gridY++) {
    for (let gridX = 0; gridX < tileCountX; gridX++) {
      if (i >= elementImages.length) {
        text(
          'Drop to upload',
          gridX * tileWidth + 20,
          gridY * tileHeight + tileWidth / 2
        )
      } else {
        const tmp = elementImages[i].get()
        tmp.resize(0, tileHeight)
        image(tmp, gridX * tileWidth, gridY * tileHeight)

        if (sourceIndex === i) {
          noFill()
          stroke('green')
          strokeWeight(4)
          rect(
            gridX * tileWidth + tileWidth / 2,
            gridY * tileHeight + tileWidth / 2,
            tileWidth,
            tileWidth
          )
          fill('black')
          noStroke()
        }
      }
      i++
    }
  }
}

const deleteImage = index => {
  cimages.images.splice(index, 1)
  config.selectedIndex =
    config.selectedIndex < cimages.images.length
      ? config.selectedIndex
      : config.selectedIndex - 1
  displayGallery()
}

function mode0 () {
  displayGallery()

  sounds[0].play()
}

// Full-length strips
function mode1 () {
  activity = activityModes.Drawing
  config.currentMode = mode1
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
function mode2 () {
  activity = activityModes.Drawing
  config.currentMode = mode2

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
    const stripX = random(stripW / -2, target.width)
    const stripY = random(stripH / -2, target.height)
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

// discarded original
// now based on /Users/michaelpaulukonis/projects/Code-Package-p5.js/01_P/P_4_2_1_02
function mode3 () {
  activity = activityModes.Drawing
  config.currentMode = mode3

  target.image(cimages.random.cropped, 0, 0)

  target.imageMode(CENTER)
  // TODO: get random croppings instead of one cropping
  const img1 = cimages.random.cropped.get()
  const img2 = cimages.random.cropped.get()
  const img3 = cimages.random.cropped.get()

  const items1 = generateCollageItems(
    img1,
    random(10, 30),
    0,
    target.height / 2,
    PI * 5,
    target.height,
    0.1,
    0.5,
    0,
    0
  )
  const items2 = generateCollageItems(
    img2,
    random(15, 40),
    0,
    target.height * 0.15,
    PI * 5,
    150,
    0.1,
    random(0.3, 0.8),
    -PI / 6,
    PI / 65
  )
  const items3 = generateCollageItems(
    img3,
    random(10, 45),
    0,
    target.height * 0.66,
    PI * 5,
    target.height * 0.66,
    0.1,
    random(0.2, 0.5),
    -0.05,
    0.05
  )

  // masks will have to go in here
  // unless.... in generate?
  drawCollageitems(items1, config)
  drawCollageitems(items2, config)
  drawCollageitems(items3, config)
  if (config.outline) {
    target.strokeWeight(config.outlineWeight)
    target.stroke('black')
    target.noFill()
    target.rect(0, 0, target.width, target.height)
  }

  image(target, 0, 0, displayCanvas.width, displayCanvas.height)
  target.imageMode(CORNER)
  random(sounds).play()
}

// take in array of images
// never do the circle thing
// outline may have to go away?
function generateCollageItems (
  img,
  count,
  angle,
  length,
  rangeA,
  rangeL,
  scaleStart,
  scaleEnd,
  rotationStart,
  rotationEnd
) {
  var layerItems = []
  if (config.circle) {
    let customMask = createGraphics(img.width, img.height)
    customMask.noStroke()
    customMask.fill(255)
    customMask.circle(
      img.width / 2,
      img.height / 2,
      Math.min(img.height, img.width)
    )
    img.mask(customMask)
    customMask.remove()
  }
  for (var j = 0; j < count; j++) {
    var collageItem = new CollageItem(img)
    collageItem.a = angle + random(-rangeA / 2, rangeA / 2)
    collageItem.l = length + random(-rangeL / 2, rangeL / 2)
    collageItem.scaling = random(scaleStart, scaleEnd)
    collageItem.rotation =
      collageItem.a + HALF_PI + random(rotationStart, rotationEnd)
    layerItems.push(collageItem)
  }
  return layerItems
}

function CollageItem (image) {
  this.a = 0
  this.l = 0
  this.rotation = 0
  this.scaling = 1
  this.image = image
}

function drawCollageitems (layerItems, params) {
  target.strokeWeight(0)
  if (params.outline) {
    target.strokeWeight(params.outlineWeight)
    target.stroke('black')
    target.noFill()
  }

  for (var i = 0; i < layerItems.length; i++) {
    const img = layerItems[i].image
    target.push()
    target.translate(
      target.width / 2 + cos(layerItems[i].a) * layerItems[i].l,
      target.height / 2 + sin(layerItems[i].a) * layerItems[i].l
    )
    target.rotate(layerItems[i].rotation)
    // TODO: multiple masks crash my computer
    // try https://stackoverflow.com/a/71061573/41153
    if (config.circle) {
      target.circle(
        0,
        0,
        Math.min(img.height, img.width) * layerItems[i].scaling
      )
    } else {
      target.rect(
        (-img.width * layerItems[i].scaling) / 2,
        (-img.height * layerItems[i].scaling) / 2,
        img.width * layerItems[i].scaling,
        img.height * layerItems[i].scaling
      )
    }
    target.image(
      layerItems[i].image,
      0,
      0,
      img.width * layerItems[i].scaling,
      img.height * layerItems[i].scaling
    )

    target.pop()
  }
}

// Floating pixels
function mode4 () {
  activity = activityModes.Drawing
  config.currentMode = mode4

  target.fill(0)
  target.rect(0, 0, target.width, target.height)
  target.noStroke()
  for (let i = 0; i < 900; i++) {
    img = cimages.random.cropped

    const stripX = random(target.width)
    const stripY = random(target.height)
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

// TODO: check if a box is a subset/superset of another box,
// and then .... uh, something
// this is an elaboration of mode2/mode7
// try to integrate mode7 and make these more flexible?
function mode5 () {
  activity = activityModes.Drawing
  config.currentMode = mode5

  const coinflip = () => random() < config.solidProb
  target.image(cimages.random.cropped, 0, 0)

  if (config.outline) {
    target.strokeWeight(config.outlineWeight)
    target.stroke('black')
    target.noFill()
  }

  // these are not strips, they are overall images
  // but still, not as many showing up as expected
  for (let i = 0; i < config.stripCount; i++) {
    let cf = coinflip()
    img = cf
      ? random(
          config.addin === addins.Solid || !config.patternsReady
            ? solids
            : patternImages
        )
      : cimages.random.cropped

    const stripW = random(config.stripMin, config.stripMax)
    const stripH = config.circle
      ? stripW
      : random(config.stripMin, config.stripMax)
    const stripX = Math.round(random(stripW / -2, target.width))
    const stripY = Math.round(random(stripH / -2, target.height))

    let strip
    switch (config.fragmentStrategy) {
      case fragmentStrategies.LOCATION_FRAGMENT:
        strip = img.get(stripX, stripY, stripW, stripH)
        break
      case fragmentStrategies.RANDOM:
        strip = img.get(
          random(0, img.width - stripW),
          random(0, img.height - stripH),
          stripW,
          stripH
        )
        break
      case fragmentStrategies.FULL_CENTERED:
        const scale = img.width / Math.max(stripW, stripH)
        strip = createImage(stripW, stripH)
        const scaledWidth = stripW * scale
        const scaledHeight = stripH * scale
        strip.copy(
          img,
          img.width / 2 - scaledWidth / 2,
          img.height / 2 - scaledHeight / 2,
          scaledWidth,
          scaledHeight,
          0,
          0,
          stripW,
          stripH
        )
    }

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
      target.image(strip, stripX, stripY)
    } else {
      target.rect(stripX, stripY, stripW, stripH)
      target.image(strip, stripX, stripY)
    }
  }

  if (config.outline) {
    target.rect(0, 0, target.width, target.height)
  }

  target.strokeWeight(0)
  image(target, 0, 0, displayCanvas.width, displayCanvas.height)
  random(sounds).play()
}

// Horizontal free strips
function mode6 () {
  activity = activityModes.Drawing
  config.currentMode = mode6

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

// Mondrian stripes
function mode7 () {
  activity = activityModes.Drawing
  config.currentMode = mode7

  target.noStroke()

  mondrian(
    target.width,
    target.height,
    1,
    1,
    config.mondrianProb,
    random(2) < 1
  )
  // target.filter(DILATE);
  image(target, 0, 0, displayCanvas.width, displayCanvas.height)
  random(sounds).play()
}

// Horizontally stretched
function mode8 () {
  activity = activityModes.Drawing
  config.currentMode = mode8

  target.noStroke()
  const backGrnd = cimages.random.cropped

  for (let j = 0; j < target.height; j += 5) {
    const c = backGrnd.get(target.width / 2, j)
    target.fill(c)
    target.rect(0, j, target.width, 5)
  }

  for (let i = 0; i < 200; i++) {
    img = cimages.random.cropped

    const stripX = random(target.width)
    const stripY = random(target.height)
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
// variation ideas: single image, over circles on that
function mode9 () {
  activity = activityModes.Drawing
  config.currentMode = mode9

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
  // Recursion calls: Divide againv
  const coinFlip = random(1) < prob
  if (coinFlip) {
    if (vertical) {
      const wDivision = floor(random(w * factor.low, w * factor.high))
      mondrianInner(wDivision, h, x, y, prob * config.mondrianProbFactor, false)
      mondrianInner(
        w - wDivision,
        h,
        x + wDivision,
        y,
        prob * config.mondrianProbFactor,
        false
      )
    } else {
      const hDivision = floor(random(h * factor.low, h * factor.high))
      mondrianInner(w, hDivision, x, y, prob * config.mondrianProbFactor, true)
      mondrianInner(
        w,
        h - hDivision,
        x,
        y + hDivision,
        prob * config.mondrianProbFactor,
        true
      )
    }
  } else {
    // Base case: Draw rectangle
    img = cimages.random.cropped
    const tileHeight = max(h, 0)
    const tileWidth = max(w, 0)
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
          const c = img.get(x, y + j)

          target.fill(c)
          target.rect(x, y + j, tileWidth, config.stripeSize)
        }
      } else {
        // Draw vertical strips
        for (let j = 0; j < tileWidth; j += config.stripeSize) {
          const c = img.get(x + j, y)

          target.fill(c)
          target.rect(x + j, y, config.stripeSize, tileHeight)
        }
      }
    } else {
      const strip = img.get(x, y, tileWidth, tileHeight)
      if (tileHeight !== 0 && tileWidth !== 0) {
        target.rect(x, y, tileWidth, tileHeight)
        target.image(strip, x, y)
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

function createCols (url) {
  let slaIndex = url.lastIndexOf('/')
  let colStr = url.slice(slaIndex + 1)
  let colArr = colStr.split('-')
  for (let i = 0; i < colArr.length; i++) colArr[i] = '#' + colArr[i]
  return colArr
}

function getDominantColors (img, numColors, colorDistance = 8) {
  // Resize the image to a smaller size to speed up the analysis
  img.resize(10, 10)

  // Get the pixel data
  img.loadPixels()
  let pixels = img.pixels

  // Create a histogram of the pixel colors
  let histogram = {}
  for (let i = 0; i < pixels.length; i += 4) {
    let r = pixels[i]
    let g = pixels[i + 1]
    let b = pixels[i + 2]

    // Group similar colors together
    let key = `${Math.round(r / colorDistance) * colorDistance},${
      Math.round(g / colorDistance) * colorDistance
    },${Math.round(b / colorDistance) * colorDistance}`
    if (histogram[key]) {
      histogram[key]++
    } else {
      histogram[key] = 1
    }
  }

  // Sort the histogram by frequency and get the top numColors colors
  let sortedColors = Object.entries(histogram)
    .sort((a, b) => b[1] - a[1])
    .slice(0, numColors)
    .map(entry => {
      let [r, g, b] = entry[0].split(',').map(Number)
      return color(r, g, b)
    })

  return sortedColors
}
