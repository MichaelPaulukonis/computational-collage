let sounds = []; // array for sound effects
let actionSound; // Sound for actions inclu save, blend & clear uploads
let images = []; // array for source images
let userUploads = []; // buffer array for storing user uploads
let isUploads = false; // Initial boolean value of user load status
let isHorizontal = true; // Initial boolean value of pattern direction
let isBlended = false; // Initial bool value of the image blending status
let img; // singel image buffer
let probFactor = 0.9; // mondrian division probability factor
let thickness = 0; // mondrian grid thickness
let displayCanvas; // canvas
let namer = filenamer(datestring());
const modes = [ mode0, mode1, mode2, mode3, mode4, mode5, mode6, mode7, mode8, mode9 ]
let target // graphics object at full size

function preload() {
  // Load consistently-named images into an array
  for (let i = 0; i < 6; i++) {
    images[i] = loadImage("uploads/trees" + i + ".jpg");
  }

  // Load sounds: Sound from Zapsplat.com
  for (let i = 0; i < 4; i++) {
    sounds[i] = loadSound("uploads/sound" + i + ".mp3");
  }

  actionSound = loadSound("uploads/glassy0.mp3");
}


function setup() {
  displayCanvas = createCanvas(500, 500);
  displayCanvas.drop(handleFile);
  target = createGraphics(1000, 1000)

  setupButtons()

  for (let i = 0, n = images.length; i < n; i++) {
    images[i] = squareCrop(images[i])
    images[i].resize(target.width, 0);
  }

  noLoop();
}

const squareCrop = (img) => {
  let w = img.width;
  let h = img.height;
  let min = Math.min(w, h);
  let x = (w - min) / 2;
  let y = (h - min) / 2;
  return img.get(x, y, min, min);
}


function setupButtons() {
  var btnX = 20;
  var btnYStart = 160;
  var btnYStep = 40;
  var modeBtn;
  var white = color(255);
  var dark = color(30);
  var whiteTrans = color(255, 255, 255, 80);
  var blackTrans = color(0, 0, 0, 80)

  // Upload button
  uploadBtn = createButton('upload');
  uploadBtn.mousePressed(dropFiles);
  uploadBtn.position(btnX, btnYStart);
  uploadBtn.style('background-color', dark);
  uploadBtn.style('color', white);
  uploadBtn.style('border', "1px");
  uploadBtn.style('border', dark);
  uploadBtn.style('width', "60px");
  uploadBtn.style('padding-top', '3px');
  uploadBtn.style('padding-bottom', '3px');

  // Clear uploads button
  clearBtn = createButton('clear');
  clearBtn.position(btnX, btnYStart);
  clearBtn.mousePressed(clearUploads);
  clearBtn.style('background-color', dark);
  clearBtn.style('color', white);
  clearBtn.style('border', "1px");
  clearBtn.style('border', dark);
  clearBtn.style('width', "60px");
  clearBtn.style('padding-top', '3px');
  clearBtn.style('padding-bottom', '3px');
  clearBtn.hide();

  // Download button
  downloadBtn = createButton('save');
  downloadBtn.mousePressed(download);
  downloadBtn.position(btnX, btnYStart += btnYStep);
  downloadBtn.style('background-color', dark);
  downloadBtn.style('color', white);
  downloadBtn.style('border', "1px");
  downloadBtn.style('border', dark);
  downloadBtn.style('width', "60px");
  downloadBtn.style('padding-top', '3px');
  downloadBtn.style('padding-bottom', '3px');

  // A list of mode buttons
  for (let n = 0; n < 10; n++) {
    if (n == 0) {
      modeBtn = createButton('original');
      modeBtn.mousePressed(mode0);
    } else {
      modeBtn = createButton('mode ' + n);
      modeBtn.mousePressed(modes[n]);
    }

    modeBtn.position(btnX, btnYStart + (btnYStep * n + 1))
    modeBtn.style('background-color', blackTrans);
    modeBtn.style('color', white);
    modeBtn.style('border', "1px solid white");
    modeBtn.style('width', "60px");
    modeBtn.style('padding-top', '3px');
    modeBtn.style('padding-bottom', '3px');
  }

  // Blend mode button
  blendBtn = createButton('blend');
  blendBtn.mousePressed(blendLightest);
  blendBtn.position(btnX, btnYStart + btnYStep * 10); // sub-optimal
  blendBtn.style('background-color', blackTrans);
  blendBtn.style('color', white);
  blendBtn.style('border', "none");
  blendBtn.style('padding-top', '3px');
  blendBtn.style('padding-bottom', '3px');

  // Reset blend mode button
  resetBtn = createButton('clear blend');
  resetBtn.mousePressed(resetBlend);
  resetBtn.position(btnX, btnYStart + btnYStep * 10);
  resetBtn.style('background-color', blackTrans);
  resetBtn.style('color', white);
  resetBtn.style('border', "none");
  resetBtn.style('padding-top', '3px');
  resetBtn.style('padding-bottom', '3px');
  resetBtn.hide();
}

function draw() {
  background(0);

  // Check if user has supplied photos
  if (isUploads) {
    uploadBtn.hide();
    clearBtn.show();
  }

  mode0();
  random(sounds).play();
}

function keyTyped() {
  if (key === "s") {
    download()
  } else if (key === "b") {
    blendLightest()
  } else if (key === "r") {
    resetBlend()
  } else if (key === "c") {
    clearUploads()
  } else if (key === "u") {
    dropFiles()
  } else if (key === "h") {
    isHorizontal = !isHorizontal
  } else if (key === "p") {
    probFactor = (probFactor + 0.1) % 1
  } else if (key === "t") {
    thickness = (thickness + 1) % 10
  } else if ('0123456789'.includes(key)) {
    modes[key]()
  }
  return false
}

function dropFiles() {
  fill(60);
  noStroke();
  rect(0, 0, displayCanvas.width, displayCanvas.height);

  fill(255);
  textSize(24);
  textAlign(CENTER);
  text('Drag image files onto the canvas.', displayCanvas.width / 2, displayCanvas.height / 2);
}


// Handle file uploads
function handleFile(file) {
  if (file.type === 'image') {
    images.length = 0;
    isUploads = true;
    loadImage(file.data, img => {
      img = squareCrop(img)
      img.resize(target.width, 0);
      userUploads.push(img);
      images = [...userUploads];
      draw();
    });
  } else {
    console.log('Not an image file!');
  }
}


// Clear upload files
function clearUploads() {
  userUploads.length = 0;
  images.length = 0;
  for (let i = 0; i < 6; i++) {
    images[i] = loadImage("uploads/trees" + i + ".jpg", img => {
      img = squareCrop(img)
      img.resize(displayCanvas.width, 0);
    });
  }
  isUploads = false;
  clearBtn.hide();
  uploadBtn.show();
  actionSound.play();
  dropFiles();
}


// Download current canvas
function download() {
  actionSound.play();
  // saveCanvas(namer(), "png");
  save(target, namer(), "png")
}


// Show input image gallery (no more than 9 for speed)
function mode0() {
  let tileCountX = 3;
  let tileCountY = 3;

  let tileWidth = displayCanvas.width / tileCountX;
  let tileHeight = displayCanvas.height / tileCountY;

  let i = 0;
  for (let gridY = 0; gridY < tileCountY; gridY++) {
    for (let gridX = 0; gridX < tileCountX; gridX++) {
      tmp = images[i].get();
      tmp.resize(0, tileHeight);
      image(tmp, gridX * tileWidth, gridY * tileHeight);
      if (i == images.length - 1) {
        i = 0;
      } else {
        i++;
      }
    }
  }

  sounds[0].play();
}


// Full-length strips
function mode1() {
  if (isHorizontal) {
    for (let y = 0; y < target.height; y += 10) {
      img = random(images);

      // pick a y point to get the strip
      let stripYPosition = int(random(0, img.height - 10));

      // use get() to extract a strip of the image
      let strip = img.get(0, stripYPosition, img.width, 10);

      target.image(strip, 0, y);
    }
    isHorizontal = false;
  }

  // Toggle to vertical
  else {
    for (let x = 0; x < target.width; x += 10) {
      img = random(images);

      // pick a x point to get the strip
      let stripXPosition = int(random(0, img.width - 10));

      // use get() to extract a strip of the image
      let strip = img.get(stripXPosition, 0, 10, img.width);
      target.image(strip, x, 0);
    }
    isHorizontal = true;
  }
  // TODO: need a better solution
  image(target, 0, 0, displayCanvas.width, displayCanvas.height)
  random(sounds).play();
}


// Collaging random chunks
function mode2() {
  target.image(random(images), 0, 0)
  for (let i = 0; i < 200; i++) {
    img = random(images);
    stripX = random(img.width);
    stripY = random(img.height);
    stripW = random(50, 150);
    stripH = random(50, 150);
    let strip = img.get(stripX, stripY, stripW, stripH);
    target.image(strip, stripX, stripY);
  }
  // filter(ERODE);
  // filter(THRESHOLD, 0.4);
  target.filter(DILATE);
  image(target, 0, 0, displayCanvas.width, displayCanvas.height)
  random(sounds).play();
}


// Regular grid of stretched pixels
function mode3() {
  target.noStroke();
  let tileHeight = 20;
  let tileWidth = random(20, 50);

  let tileCountY = target.height / tileHeight;
  let tileCountX = target.width / tileWidth;

  for (let gridY = 0; gridY < tileCountY; gridY++) {
    for (let gridX = 0; gridX < tileCountX; gridX++) {
      img = random(images);

      for (let j = 0; j < tileHeight; j++) {
        let c = img.get(gridX * tileWidth, gridY * tileHeight + j);
        target.fill(c);
        target.rect(gridX * tileWidth, gridY * tileHeight + j, tileWidth, 1);
      }
    }
  }
  image(target, 0, 0, displayCanvas.width, displayCanvas.height)
  random(sounds).play();
}


// Floating pixels
function mode4() {
  target.fill(0);
  target.rect(0, 0, target.width, target.height);
  target.noStroke();
  for (let i = 0; i < 900; i++) {
    img = random(images);
    stripX = random(img.width);
    stripY = random(img.height);
    stripW = random(20, 30);
    stripH = random(20, 30);
    if (random(0, 1) > 0.6) {
      let c = img.get(stripX, stripY);
      target.fill(c);
      target.rect(stripX, stripY, stripW, stripH);
    } else {
      let strip = img.get(stripX, stripY, stripW, stripH);
      target.image(strip, stripX, stripY);
    }
  }
  image(target, 0, 0, displayCanvas.width, displayCanvas.height)
  random(sounds).play();
}


// Floating rounded rectangular splashes
function mode5() {
  target.noStroke();
  img = random(images);
  let c = img.get(target.width / 2, target.height / 2);
  target.fill(c);
  target.rect(0, 0, target.width, target.height);

  for (let i = 0; i < 1500; i++) {
    img = random(images);
    stripX = random(img.width);
    stripY = random(img.height);
    stripW = random(5, 30);
    stripH = random(5, 30);

    let c = img.get(stripX, stripY);
    target.fill(c);
    target.rect(stripX, stripY, stripW, stripH, 5);
  }
  image(target, 0, 0, displayCanvas.width, displayCanvas.height)
  random(sounds).play();
}


// Horizontal free strips
function mode6() {
  target.noStroke();
  let tileHeight = 5;
  let tileCountY = target.height / tileHeight;

  for (let gridY = 0; gridY < tileCountY; gridY++) {
    let x = 0;
    while (x < target.width) {
      let tileWidth = random(15, 40);
      let y = gridY * tileHeight;
      img = random(images);

      // Base grid tile
      target.rect(x, y, tileWidth, tileHeight);

      if (random(0, 1) > 0.7) {
        let c = img.get(x, gridY * tileHeight);
        target.fill(c);
        target.rect(random(x - 10, x + 10), random(y - 10, y + 10), tileWidth, tileHeight);
      }

      // Offset tile
      else {
        let strip = img.get(x, y, tileWidth, tileHeight);
        target.image(strip, random(x - 10, x + 10), random(y - 10, y + 10));
      }

      x += tileWidth;
    }
  }
  image(target, 0, 0, displayCanvas.width, displayCanvas.height)
  random(sounds).play();
}


// Mondrian stripes
function mode7() {
  target.noStroke();
  mondrian(target.width - thickness, target.height - thickness,
    thickness / 2, thickness / 2, 1.0, (random(2) < 1));
  target.filter(DILATE);
  image(target, 0, 0, displayCanvas.width, displayCanvas.height)
  random(sounds).play();
}


// Horizontally stretched
function mode8() {
  target.noStroke();
  // Create a background
  bg = random(images);
  for (let j = 0; j < target.height; j += 5) {
    let c = bg.get(target.width / 2, j);
    target.fill(c);
    target.rect(0, j, target.width, 5);
  }

  for (let i = 0; i < 200; i++) {
    img = random(images);
    stripX = random(img.width);
    stripY = random(img.height);
    stripW = random(50, 150);
    stripH = random(50, 150);

    for (let j = 0; j < stripH; j++) {
      let c = img.get(stripX, stripY + j);
      target.fill(c);
      target.rect(stripX, stripY + j, stripW, 1);
    }
  }
  target.filter(DILATE);
  image(target, 0, 0, displayCanvas.width, displayCanvas.height)
  random(sounds).play();
}


// Concentric circle splashes
function mode9() {
  target.fill(0);
  target.noStroke();
  target.rect(0, 0, width, height);
  target.noFill();
  target.blendMode(LIGHTEST);

  for (let i = 0; i < 450; i++) {
    img = random(images);
    X = random(target.width);
    Y = random(target.height);
    R = random(5, 200);
    interval = int(random(4, 10));
    numColors = int(random(1, 3));
    target.strokeWeight(int(random(1, 3)));

    // Color palette
    let colors = [];
    for (let n = 0; n < numColors; n++) {
      colors[n] = img.get(min(target.width - 2, X + 2 * n), min(target.height - 2, Y + 2 * n));
    }

    let cIndex = 0;

    // Draw con-centric circles
    for (let r = 0; r < R; r += interval) {
      target.stroke(colors[cIndex]);
      target.circle(X, Y, r);

      if (cIndex == numColors - 1) {
        cIndex = 0;
      } else {
        cIndex++;
      }
    }
  }
  if (!isBlended) {
    target.blendMode(BLEND);
  }
  image(target, 0, 0, displayCanvas.width, displayCanvas.height)

  sounds[3].play();
}


// Draw mondrian-style grid of collages
function mondrian(w, h, x, y, prob, vertical) {
  // Recursion calls: Divide again
  if (random(1) < prob) {
    if (vertical) {
      var wDivision = floor(random(w * 0.3, w * 0.7));
      mondrian(wDivision, h, x, y, prob * probFactor, false);
      mondrian(w - wDivision, h, x + wDivision, y, prob * probFactor, false);
    } else {
      var hDivision = floor(random(h * 0.3, h * 0.7));
      mondrian(w, hDivision, x, y, prob * probFactor, true);
      mondrian(w, h - hDivision, x, y + hDivision, prob * probFactor, true);
    }
  }

  // Base case: Draw rectangle
  else {
    img = random(images);

    let tileHeight = max(h - thickness, 0);
    let tileWidth = max(w - thickness, 0);

    if (tileWidth > 100 || tileHeight > 100) {
      // Draw horizontal stripes
      if (random(1) > 0.5) {
        for (j = 0; j < tileHeight; j++) {
          let c = img.get(x + thickness / 2, y + thickness / 2 + j);
          target.fill(c);
          target.rect(x + thickness / 2, y + thickness / 2 + j, tileWidth, 1);
        }
      }

      // Draw vertical strips
      else {
        for (j = 0; j < tileWidth; j++) {
          let c = img.get(x + thickness / 2 + j, y + thickness / 2);
          target.fill(c);
          target.rect(x + thickness / 2 + j, y + thickness / 2, 1, tileHeight);
        }
      }
    } else {
      let strip = img.get(x + thickness / 2, y + thickness / 2, tileWidth, tileHeight);
      if (tileHeight != 0 && tileWidth != 0) {
        target.image(strip, x + thickness / 2, y + thickness / 2);
      }
    }
  }
}


// Reset default blend mode
function resetBlend() {
  blendMode(BLEND);
  isBlended = false;
  resetBtn.hide();
  blendBtn.show();
  actionSound.play();
}


// Set to Lightest image blend mode
function blendLightest() {
  blendMode(LIGHTEST);
  isBlended = true;
  resetBtn.show();
  blendBtn.hide();
  actionSound.play();
}