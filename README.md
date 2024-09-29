# Computational Collage

I've worked with other "collage" projects, but nothing made me very happy.

Then I looked again at , and liked a number of the results, despite them being utterly unlike anything I had worked with before.

Also taking inspiration from a Generatie Design application Code-Package-p5.js/01_P/P_4_2_1_02

## roadmap

- more like my stuff
  - hah! what does THAT mean ?!?!?
- play with blending modes
- bigger image fragments overlayed
- ~~"mondrian" mode takes from semi-random part of (original) image~~
- ~~Patterns in some of the blocks~~
- outline variety?
- animation of blocks coming and going
- in gallery, pick which ones are used for collage, which ones are used for background, etc. like picking (one or more )for colors
- there some UI in another tool I played with, about screens?
- phase out original buttons
- add help screen
- ~~publish to github.io~~
- outlines/masks into CollageImage class?
- import vector-path along with transparents for outlines

## some things to look at

- <https://github.com/antiboredom/p5.patgrad>
- <https://github.com/SYM380/p5.pattern>
- <https://b2renger.github.io/p5js_patterns/>

- rectangular selection - https://stackoverflow.com/questions/74334364/drawing-a-rectangle-with-mouse-position-in-p5js
- also the vectors in https://schultzschultz.com/p5_tools/pixelStretch_Desktop/


## shape editor

at `shaper.html`

`r` - rotate mode
`c` - crop and display
`s` - save
`R` - reset

drag-n-drop new image to use

### TODO

- zoom
- points/lines change with zoom
- configurable colors
- curves
- hollows?
- link from main page, with explanations


## Original notes 

From < https://github.com/zhixin-lin/computational-collage.git>

A Web-based Generative Collage Tool That Breathes New Life Into One’s Photo Collections


This project uses p5.js to explore ways to breathe new life into one’s digital photo collections through creative generative collaging. Collaging, the art of arranging different fragments in a frame, has long been a powerful device for expressions. Artists make collages to deliver manifestos through overlaying discrete fragments by hand or in photoshop. Social media users make collages to attract likes using photo editing apps. Either way, collaging is typically characterized by combinations of discrete objects or image frames.


The project is live at: https://www.openprocessing.org/sketch/1043711

Learn more about the project at: https://www.zhixinlin.com/computational-collage

Developed by Zhixin Lin

### There have been significant changes since the original

uses https://github.com/makinteract/p5js-vite?tab=readme-ov-file


## image-shaper

- originally @ https://editor.p5js.org/MichaelPaulukonis/sketches/cg_LK7asX
- used to create a zipped pair of a cutout image with the vectors of that cutout
- the file is then imported by another collage-program of mine

### roadmap

- shape "library"
  - see the thing used for .... that other thing.
  - the one that was mostly dumb html
- load existing vectors onto image
- standard shapes
  - including text <https://erraticgenerator.com/blog/p5js-texttopoints-function/>
- bezier curves, wooo!
- ~~rotation~~
- ~~edit vectors once drawn (prior to render)~~
- better handling of in/out sizes
  - semi-handled, but we should display size and allow shrinking
- some semblance of a UI
- https://programmingdesignsystems.com/shape/custom-shapes/index.html
  - https://programmingdesignsystems.com/shape/procedural-shapes/index.html
  - contours are the p5js term for "holes" in a shape
- shapes https://github.com/gaba5/p5.shape.js
- https://c2js.org/examples.html?name=Chromosome3

## new modes

- "checkerboard" pattern - alternate squares from two images
