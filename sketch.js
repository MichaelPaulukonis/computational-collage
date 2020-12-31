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
let c; // canvas


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
  c = createCanvas(1000, 750);

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
      if (n == 1) {
        modeBtn.mousePressed(mode1);
      }
      if (n == 2) {
        modeBtn.mousePressed(mode2);
      }
      if (n == 3) {
        modeBtn.mousePressed(mode3);
      }
      if (n == 4) {
        modeBtn.mousePressed(mode4);
      }
      if (n == 5) {
        modeBtn.mousePressed(mode5);
      }
      if (n == 6) {
        modeBtn.mousePressed(mode6);
      }
      if (n == 7) {
        modeBtn.mousePressed(mode7);
      }
      if (n == 8) {
        modeBtn.mousePressed(mode8);
      }
      if (n == 9) {
        modeBtn.mousePressed(mode9);
      }
    }

    modeBtn.position(btnX, btnYStart += btnYStep);
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
  blendBtn.position(btnX, btnYStart += btnYStep);
  blendBtn.style('background-color', blackTrans);
  blendBtn.style('color', white);
  blendBtn.style('border', "none");
  blendBtn.style('padding-top', '3px');
  blendBtn.style('padding-bottom', '3px');

  // Reset blend mode button
  resetBtn = createButton('clear blend');
  resetBtn.mousePressed(resetBlend);
  resetBtn.position(btnX, btnYStart);
  resetBtn.style('background-color', blackTrans);
  resetBtn.style('color', white);
  resetBtn.style('border', "none");
  resetBtn.style('padding-top', '3px');
  resetBtn.style('padding-bottom', '3px');
  resetBtn.hide();

  // Proportionally resize all images to be the same width as the canvas
  for (let i = 0, n = images.length; i < n; i++) {
    images[i].resize(width, 0);
  }

  noLoop();
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


function dropFiles() {
  fill(60);
  noStroke();
  rect(0, 0, width, height);
  c.drop(handleFile);

  fill(255);
  textSize(24);
  textAlign(CENTER);
  text('Drag image files onto the canvas.', width / 2, height / 2);
}


// Handle file uploads
function handleFile(file) {
  if (file.type === 'image') {
    images.length = 0;
    isUploads = true;
    loadImage(file.data, img => {
      img.resize(width, height);
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
      img.resize(width, 0);
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
  saveCanvas('download', 'png')
}


// Show input image gallery (no more than 9 for speed)
function mode0() {
  let tileCountX = 3;
  let tileCountY = 3;

  let tileWidth = width / tileCountX;
  let tileHeight = height / tileCountY;

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
    for (let y = 0; y < height; y += 10) {
      img = random(images);

      // pick a y point to get the strip
      let stripYPosition = int(random(0, img.height - 10));

      // use get() to extract a strip of the image
      let strip = img.get(0, stripYPosition, img.width, 10);

      image(strip, 0, y);
    }
    isHorizontal = false;
  }

  // Toggle to vertical
  else {
    for (let x = 0; x < width; x += 10) {
      img = random(images);

      // pick a x point to get the strip
      let stripXPosition = int(random(0, img.width - 10));

      // use get() to extract a strip of the image
      let strip = img.get(stripXPosition, 0, 10, img.width);
      image(strip, x, 0);
    }
    isHorizontal = true;
  }
  
  random(sounds).play();
}


// Collaging random chunks
function mode2() {
  image(random(images), 0, 0)
  for (let i = 0; i < 200; i++) {
    img = random(images);
    stripX = random(img.width);
    stripY = random(img.height);
    stripW = random(50, 150);
    stripH = random(50, 150);
    let strip = img.get(stripX, stripY, stripW, stripH);
    image(strip, stripX, stripY);
  }
  // filter(ERODE);
  // filter(THRESHOLD, 0.4);
  filter(DILATE);
  random(sounds).play();
}


// Regular grid of stretched pixels
function mode3() {
  noStroke();
  let tileHeight = 20;
  let tileWidth = random(20, 50);

  let tileCountY = height / tileHeight;
  let tileCountX = width / tileWidth;

  for (let gridY = 0; gridY < tileCountY; gridY++) {
    for (let gridX = 0; gridX < tileCountX; gridX++) {
      img = random(images);

      for (let j = 0; j < tileHeight; j++) {
        let c = img.get(gridX * tileWidth, gridY * tileHeight + j);
        fill(c);
        rect(gridX * tileWidth, gridY * tileHeight + j, tileWidth, 1);
      }
    }
  }
  random(sounds).play();
}


// Floating pixels
function mode4() {
  fill(0);
  rect(0, 0, width, height);
  noStroke();
  for (let i = 0; i < 900; i++) {
    img = random(images);
    stripX = random(img.width);
    stripY = random(img.height);
    stripW = random(20, 30);
    stripH = random(20, 30);
    if (random(0, 1) > 0.6) {
      let c = img.get(stripX, stripY);
      fill(c);
      rect(stripX, stripY, stripW, stripH);
    } else {
      let strip = img.get(stripX, stripY, stripW, stripH);
      image(strip, stripX, stripY);
    }
  }
  random(sounds).play();
}


// Floating rounded rectangular splashes
function mode5() {
  noStroke();
  img = random(images);
  let c = img.get(width / 2, height / 2);
  fill(c);
  rect(0, 0, width, height);

  for (let i = 0; i < 1500; i++) {
    img = random(images);
    stripX = random(img.width);
    stripY = random(img.height);
    stripW = random(5, 30);
    stripH = random(5, 30);

    let c = img.get(stripX, stripY);
    fill(c);
    rect(stripX, stripY, stripW, stripH, 5);
  }
  random(sounds).play();
}


// Horizontal free strips
function mode6() {
  noStroke();
  let tileHeight = 5;
  let tileCountY = height / tileHeight;

  for (let gridY = 0; gridY < tileCountY; gridY++) {
    let x = 0;
    while (x < width) {
      let tileWidth = random(15, 40);
      let y = gridY * tileHeight;
      img = random(images);

      // Base grid tile
      rect(x, y, tileWidth, tileHeight);

      if (random(0, 1) > 0.7) {
        let c = img.get(x, gridY * tileHeight);
        fill(c);
        rect(random(x - 10, x + 10), random(y - 10, y + 10), tileWidth, tileHeight);
      }

      // Offset tile
      else {
        let strip = img.get(x, y, tileWidth, tileHeight);
        image(strip, random(x - 10, x + 10), random(y - 10, y + 10));
      }

      x += tileWidth;
    }
  }
  
  random(sounds).play();
}


// Mondrian stripes
function mode7() {
  noStroke();
  mondrian(width - thickness, height - thickness,
    thickness / 2, thickness / 2, 1.0, (random(2) < 1));
  filter(DILATE);
  random(sounds).play();
}


// Horizontally stretched
function mode8() {
  noStroke();
  // Create a background
  bg = random(images);
  for (let j = 0; j < height; j += 5) {
    let c = bg.get(width / 2, j);
    fill(c);
    rect(0, j, width, 5);
  }

  for (let i = 0; i < 200; i++) {
    img = random(images);
    stripX = random(img.width);
    stripY = random(img.height);
    stripW = random(50, 150);
    stripH = random(50, 150);
    // let strip = img.get(stripX, stripY, stripW, stripH);
    // image(strip, stripX, stripY);

    for (let j = 0; j < stripH; j++) {
      let c = img.get(stripX, stripY + j);
      fill(c);
      rect(stripX, stripY + j, stripW, 1);
    }
  }
  filter(DILATE);
  random(sounds).play();
}


// Concentric circle splashes
function mode9() {
  fill(0);
  noStroke();
  rect(0, 0, width, height);
  noFill();
  blendMode(LIGHTEST);

  for (let i = 0; i < 450; i++) {
    img = random(images);
    X = random(width);
    Y = random(height);
    R = random(5, 200);
    interval = int(random(4, 10));
    numColors = int(random(1, 3));
    strokeWeight(int(random(1, 3)));

    // Color palette
    let colors = [];
    for (let n = 0; n < numColors; n++) {
      colors[n] = img.get(min(width - 2, X + 2 * n), min(height - 2, Y + 2 * n));
    }

    let cIndex = 0;

    // Draw con-centric circles
    for (let r = 0; r < R; r += interval) {
      stroke(colors[cIndex]);
      circle(X, Y, r);

      if (cIndex == numColors - 1) {
        cIndex = 0;
      } else {
        cIndex++;
      }
    }
  }
  if (!isBlended) {
    blendMode(BLEND);
  }
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
          fill(c);
          rect(x + thickness / 2, y + thickness / 2 + j, tileWidth, 1);
        }
      }

      // Draw vertical strips
      else {
        for (j = 0; j < tileWidth; j++) {
          let c = img.get(x + thickness / 2 + j, y + thickness / 2);
          fill(c);
          rect(x + thickness / 2 + j, y + thickness / 2, 1, tileHeight);
        }
      }
    } else {
      let strip = img.get(x + thickness / 2, y + thickness / 2, tileWidth, tileHeight);
      if (tileHeight != 0 && tileWidth != 0) {
        image(strip, x + thickness / 2, y + thickness / 2);
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