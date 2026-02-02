 // ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }`

var FSHADER_SOURCE =`
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`


let canvas;
let gl;
let a_Position;
let u_FragColor;
// \\let u_Size;
let u_ModelMatrix;
let u_GlobalRotateMatrix;
// let g_globalAngle = 0;
let g_globalAngle = 0;
let g_globalAngleX = 0;
let g_globalAngleY = 0;

// Poke animation variables
let g_pokeAnimation = false;
let g_pokeStartTime = 0;

// Save pose so we can return smoothly after the poke
let g_pokeSavedYellow = 0;
let g_pokeSavedWingTip = 0;
let g_pokeSavedWingFeather = 0;


const g_pokeTargetYellow = 90;
const g_pokeTargetWingTip = 0;
const g_pokeTargetFeather = 0;


const g_pokeRaiseT = 0.25;
const g_pokeHoldT  = 0.50;
const g_pokeLowerT = 0.25;

// Helpers
function clamp01(x) { return Math.max(0, Math.min(1, x)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function smoothstep01(t) {
  t = clamp01(t);
  return t * t * (3 - 2 * t);
}

function setUpWebGL() {
    // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  // gl = getWebGLContext(canvas);
  gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.enable(gl.DEPTH_TEST);
}
function connectVariablesToGLSL() {
    // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if(!u_ModelMatrix){
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  // u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  // if(!u_Size) {
  //  console.log('Failed to get the storage location of u_Size');
  //  return;
  // }

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if(!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Global Variables to UI
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_SelectedSize = 5;
let g_selectedType = POINT;
let g_selectedSegments = 10;
let g_yellowAngle = 0;
let g_yellowAnimation = false;
let g_wingTipAngle = 0;
let g_wingTipAnimation = false
let g_wingFeatherAngle = 0;
let g_wingFeatherAnimation = false;

function AddActionsForHtmlUI() {
  document.getElementById('Green').onclick = function() {g_selectedColor = [0.0, 1.0, 0.0, 1.0]; };
  document.getElementById('Red').onclick = function() {g_selectedColor = [1.0, 0.0, 0.0, 1.0]; };
  document.getElementById('clearButton').onclick = function() {g_shapesList = []; renderAllShapes()};
  
  document.getElementById('animationYellowOnButton').onclick = function() {g_yellowAnimation = true;};
  document.getElementById('animationYellowOffButton').onclick = function() {g_yellowAnimation = false};
  
  document.getElementById('redSlide').addEventListener('mouseup', function() {g_selectedColor[0] = this.value/100;});
  document.getElementById('greenSlide').addEventListener('mouseup', function() {g_selectedColor[1] = this.value/100;});
  document.getElementById('blueSlide').addEventListener('mouseup', function() {g_selectedColor[2] = this.value/100;});

  document.getElementById('sizeSlide').addEventListener('mouseup', function() {g_SelectedSize = this.value;});
  document.getElementById('pointButton').onclick = function() {g_selectedType=POINT};
  document.getElementById('triButton').onclick = function() {g_selectedType=TRIANGLE};
  document.getElementById('circleButton').onclick = function() {g_selectedType=CIRCLE};
  document.getElementById('angleSlide').addEventListener('mousemove', function() {g_globalAngle = this.value; renderAllShapes();});
  document.getElementById('yellowSlide').addEventListener('mousemove', function() {g_yellowAngle = this.value; renderAllShapes();});

  document.getElementById('animationWingTipOnButton').onclick = function() {g_wingTipAnimation = true;};
  document.getElementById('animationWingTipOffButton').onclick = function() {g_wingTipAnimation = false};
  document.getElementById('wingTipSlide').addEventListener('mousemove', function() {g_wingTipAngle = this.value; renderAllShapes();});

  document.getElementById('animationWingFeatherOnButton').onclick = function() {g_wingFeatherAnimation = true;};
  document.getElementById('animationWingFeatherOffButton').onclick = function() {g_wingFeatherAnimation = false};
  document.getElementById('wingFeatherSlide').addEventListener('mousemove', function() {g_wingFeatherAngle = this.value; renderAllShapes();});

  const segSlide = document.getElementById('segmentSlide');
  const segVal = document.getElementById('segmentVal');

  segSlide.addEventListener('input', function () {g_selectedSegments = parseInt(this.value);
    segVal.innerHTML = this.value;
  });

  document.getElementById('kiteFillButton').onclick = function() { addKiteFilledOnly(); };

}

function main() {

  setUpWebGL();
  connectVariablesToGLSL();
  AddActionsForHtmlUI();
  
  // mouse rotation control
  canvas.onmousemove = function(ev) {
    if(ev.buttons == 1) {
      if(ev.shiftKey) {
        // shift click for post animation
      } else {
        let rect = ev.target.getBoundingClientRect();
        let x = ev.clientX - rect.left;
        let y = ev.clientY - rect.top;
        
        // Map mouse position to rotation angles
        g_globalAngleY = ((x / canvas.width) - 0.5) * 360;
        g_globalAngleX = ((y / canvas.height) - 0.5) * 360;
        
        renderAllShapes();
      }
    }
  };
  
  // poke animation on shift click
canvas.onmousedown = function(ev) {
  if (ev.shiftKey) {
    // save the current pose so we can raise from it and return to it
    g_pokeSavedYellow = Number(g_yellowAngle);
    g_pokeSavedWingTip = Number(g_wingTipAngle);
    g_pokeSavedWingFeather = Number(g_wingFeatherAngle);

    // start/restart animation
    g_pokeAnimation = true;
    g_pokeStartTime = performance.now() / 1000.0;
  }
};

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  requestAnimationFrame(tick);
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0-g_startTime;

function tick(){
  g_seconds = performance.now()/1000.0-g_startTime;
  updateAnimationAngles();
  // console.log(g_seconds);
  renderAllShapes();
  requestAnimationFrame(tick);
}

function updateAnimationAngles(){
  if(g_yellowAnimation){
    g_yellowAngle = (45*Math.sin(g_seconds));    
  }
  if(g_wingTipAnimation){
    g_wingTipAngle = (45*Math.sin(g_seconds * 2));
  }
  if(g_wingFeatherAnimation){
    g_wingFeatherAngle = (30*Math.sin(g_seconds * 3));
  }
  
  // poke animation - wings do directly up and then go down
if (g_pokeAnimation) {
  const t = g_seconds - g_pokeStartTime;
  const total = g_pokeRaiseT + g_pokeHoldT + g_pokeLowerT;

  if (t < g_pokeRaiseT) {
    // raise the arms
    const a = smoothstep01(t / g_pokeRaiseT);
    g_yellowAngle = lerp(g_pokeSavedYellow, g_pokeTargetYellow,  a);
    g_wingTipAngle = lerp(g_pokeSavedWingTip, g_pokeTargetWingTip, a);
    g_wingFeatherAngle = lerp(g_pokeSavedWingFeather, g_pokeTargetFeather, a);

  } else if (t < g_pokeRaiseT + g_pokeHoldT) {
    // hold at top
    g_yellowAngle = g_pokeTargetYellow;
    g_wingTipAngle = g_pokeTargetWingTip;
    g_wingFeatherAngle = g_pokeTargetFeather;

  } else if (t < total) {
    // lower the arms
    const downT = (t - (g_pokeRaiseT + g_pokeHoldT)) / g_pokeLowerT;
    const a = smoothstep01(downT);
    g_yellowAngle = lerp(g_pokeTargetYellow,  g_pokeSavedYellow, a);
    g_wingTipAngle = lerp(g_pokeTargetWingTip, g_pokeSavedWingTip, a);
    g_wingFeatherAngle = lerp(g_pokeTargetFeather, g_pokeSavedWingFeather, a);

  } else {
    // restore original pose
    g_pokeAnimation = false;

    if (!g_yellowAnimation) g_yellowAngle = g_pokeSavedYellow;
    if (!g_wingTipAnimation) g_wingTipAngle = g_pokeSavedWingTip;
    if (!g_wingFeatherAnimation) g_wingFeatherAngle = g_pokeSavedWingFeather;
  }
}
}

var g_shapesList = [];

function click(ev) {
  [x,y] = convertCoordinatesEventToGL(ev);
  let point;
  if(g_selectedType == POINT) {
    point = new Point();
  } else if (g_selectedType == TRIANGLE){
    point = new Triangle();
  } else {
    point = new Circle();
    point.segments = g_selectedSegments;
  }
  point.position = [x, y];
  point.color = g_selectedColor.slice();
  point.size = g_SelectedSize;
  g_shapesList.push(point);

  renderAllShapes();
}

function convertCoordinatesEventToGL(ev){
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
  return([x,y]);
}

function renderAllShapes() {
  var startTime = performance.now();
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  // var globalRotMat = new Matrix4().rotate(g_globalAngle,0,1,0);
  //gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
  var globalRotMat = new Matrix4();
  globalRotMat.rotate(g_globalAngleX, 1, 0, 0);
  globalRotMat.rotate(g_globalAngle + g_globalAngleY, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Create a base matrix for the horizontal eagle orientation
  var eagleBase = new Matrix4();
  eagleBase.rotate(45, 1, 0, 0);

  // Eagle colors
  var brownBody = [0.55, 0.35, 0.2, 1.0];
  var darkBrown = [0.4, 0.25, 0.15, 1.0];
  var whiteHead = [0.95, 0.95, 0.9, 1.0];
  var yellow = [0.95, 0.8, 0.2, 1.0];
  var black = [0.1, 0.1, 0.1, 1.0];
  
  // body
  var body = new Cube();
  body.color = brownBody;
  body.matrix = new Matrix4(eagleBase);
  body.matrix.translate(-0.2, -0.3, -0.15);
  body.matrix.scale(0.4, 0.6, 0.3);
  body.render();
  
  // head
  var head = new Cube();
  head.color = whiteHead;
  head.matrix = new Matrix4(eagleBase);
  head.matrix.translate(-0.15, 0.3, -0.125);
  head.matrix.scale(0.3, 0.3, 0.25);
  head.render();
  
  // beak
  var beak = new Cube();
  beak.color = yellow;
  beak.matrix = new Matrix4(eagleBase);
  beak.matrix.translate(0, 0.54, 0.15);
  beak.matrix.scale(0.15, 0.1, 0.15);
  beak.matrix.translate(-0.5, -0.5, -0.5);
  beak.render();

  // eyes - uses spheres
  var leftEye = new Sphere();
  leftEye.color = black;
  leftEye.segments = 8;
  leftEye.matrix = new Matrix4(eagleBase);
  leftEye.matrix.translate(-0.1, 0.6, 0.15);
  leftEye.matrix.scale(0.05, 0.05, 0.05);
  leftEye.matrix.translate(-0.5, -0.5, -0.5);
  leftEye.render();

  var rightEye = new Sphere();
  rightEye.color = black;
  rightEye.segments = 8;
  rightEye.matrix = new Matrix4(eagleBase);
  rightEye.matrix.translate(0.14, 0.6, 0.15);
  rightEye.matrix.scale(0.05, 0.05, 0.05);
  rightEye.matrix.translate(-0.5, -0.5, -0.5);
  rightEye.render();
    
  // left main wing
  var leftWing = new Cube();
  leftWing.color = darkBrown;
  leftWing.matrix = new Matrix4(eagleBase);
  leftWing.matrix.translate(-0.2, 0.1, 0);
  leftWing.matrix.rotate(-g_yellowAngle, 0, 0, 1);
  var leftWingMatrix = new Matrix4(leftWing.matrix);
  leftWing.matrix.scale(0.5, 0.15, 0.25);
  leftWing.matrix.translate(-1, -0.5, -0.5);
  leftWing.render();

  // .eft secondary wing
  var leftWingTip = new Cube();
  leftWingTip.color = brownBody;
  leftWingTip.matrix = leftWingMatrix;
  leftWingTip.matrix.translate(-0.5, 0, 0);
  leftWingTip.matrix.rotate(-g_wingTipAngle, 0, 0, 1);
  var leftWingTipMatrix = new Matrix4(leftWingTip.matrix);
  leftWingTip.matrix.scale(0.3, 0.1, 0.2);
  leftWingTip.matrix.translate(-1, -0.5, -0.5);
  leftWingTip.render();

  // left wing secondary
  var leftWingFeather = new Cube();
  leftWingFeather.color = [0.3, 0.2, 0.1, 1.0];
  leftWingFeather.matrix = leftWingTipMatrix;
  leftWingFeather.matrix.translate(-0.3, 0, 0);
  leftWingFeather.matrix.rotate(-g_wingFeatherAngle, 0, 0, 1);
  leftWingFeather.matrix.scale(0.2, 0.08, 0.15);
  leftWingFeather.matrix.translate(-1, -0.5, -0.5);
  leftWingFeather.render();

  // right wing main
  var rightWing = new Cube();
  rightWing.color = darkBrown;
  rightWing.matrix = new Matrix4(eagleBase);
  rightWing.matrix.translate(0.2, 0.1, 0);
  rightWing.matrix.rotate(g_yellowAngle, 0, 0, 1);
  var rightWingMatrix = new Matrix4(rightWing.matrix);
  rightWing.matrix.scale(0.5, 0.15, 0.25);
  rightWing.matrix.translate(0, -0.5, -0.5);
  rightWing.render();

  // right wing secondary
  var rightWingTip = new Cube();
  rightWingTip.color = brownBody;
  rightWingTip.matrix = rightWingMatrix;
  rightWingTip.matrix.translate(0.5, 0, 0);
  rightWingTip.matrix.rotate(g_wingTipAngle, 0, 0, 1);
  var rightWingTipMatrix = new Matrix4(rightWingTip.matrix);
  rightWingTip.matrix.scale(0.3, 0.1, 0.2);
  rightWingTip.matrix.translate(0, -0.5, -0.5);
  rightWingTip.render();

  // right wing feathers
  var rightWingFeather = new Cube();
  rightWingFeather.color = [0.3, 0.2, 0.1, 1.0];
  rightWingFeather.matrix = rightWingTipMatrix;
  rightWingFeather.matrix.translate(0.3, 0, 0);
  rightWingFeather.matrix.rotate(g_wingFeatherAngle, 0, 0, 1);
  rightWingFeather.matrix.scale(0.2, 0.08, 0.15);
  rightWingFeather.matrix.translate(0, -0.5, -0.5);
  rightWingFeather.render();
    
  // main tail part
  var tail = new Cube();
  tail.color = darkBrown;
  tail.matrix = new Matrix4(eagleBase);
  tail.matrix.translate(0, -0.3, -0.15);
  tail.matrix.rotate(45, 1, 0, 0);
  tail.matrix.scale(0.35, 0.3, 0.15);
  tail.matrix.translate(-0.5, -0.5, -0.5);
  tail.render();

  // outer part of the tail
  var tailFan = new Cube();
  tailFan.color = brownBody;
  tailFan.matrix = new Matrix4(eagleBase);
  tailFan.matrix.translate(0, -0.45, -0.3);
  tailFan.matrix.rotate(45, 1, 0, 0);
  tailFan.matrix.scale(0.5, 0.15, 0.1);
  tailFan.matrix.translate(-0.5, -0.5, -0.5);
  tailFan.render();

  // legs
  var leftLeg = new Cube();
  leftLeg.color = yellow;
  leftLeg.matrix = new Matrix4(eagleBase);
  leftLeg.matrix.translate(-0.1, -0.40, 0);
  leftLeg.matrix.scale(0.08, 0.3, 0.08);
  leftLeg.matrix.translate(-0.5, -0.5, -0.5);
  leftLeg.render();

  var rightLeg = new Cube();
  rightLeg.color = yellow;
  rightLeg.matrix = new Matrix4(eagleBase);
  rightLeg.matrix.translate(0.1, -0.40, 0);
  rightLeg.matrix.scale(0.08, 0.3, 0.08);
  rightLeg.matrix.translate(-0.5, -0.5, -0.5);
  rightLeg.render();

  // feet (talons)
  var leftTalon = new Cube();
  leftTalon.color = darkBrown;
  leftTalon.matrix = new Matrix4(eagleBase);
  leftTalon.matrix.translate(-0.1, -0.55, 0.05);
  leftTalon.matrix.scale(0.12, 0.05, 0.15);
  leftTalon.matrix.translate(-0.5, -0.5, -0.5);
  leftTalon.render();

  var rightTalon = new Cube();
  rightTalon.color = darkBrown;
  rightTalon.matrix = new Matrix4(eagleBase);
  rightTalon.matrix.translate(0.1, -0.55, 0.05);
  rightTalon.matrix.scale(0.12, 0.05, 0.15);
  rightTalon.matrix.translate(-0.5, -0.5, -0.5);
  rightTalon.render();

}

function sendTextToHtml(text, htmlID){
  var htmlElm = document.getElementById(htmlID);
  if(!htmlElm){
    consol.log("failed to get HTML elm");
    return;
  }
  htmlElm.innerHTML = text;
}

let g_customTriBuffer = null;

function drawCustomTriangle(verts6) {
  // verts6 = [x1,y1, x2,y2, x3,y3]
  if (!g_customTriBuffer) {
    g_customTriBuffer = gl.createBuffer();
    if (!g_customTriBuffer) {
      console.log("Failed to create buffer for custom triangles");
      return;
    }
  }
  // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindBuffer
  gl.bindBuffer(gl.ARRAY_BUFFER, g_customTriBuffer);
  // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferData
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts6), gl.DYNAMIC_DRAW);

  // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/enableVertexAttribArray
  gl.enableVertexAttribArray(a_Position);

  // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawArrays
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// this function help written with chatGPT
function pushColoredTri(verts6, rgba) {
  g_shapesList.push({
    type: "customTri",
    verts: verts6,
    color: rgba.slice(),
    render: function () {
      gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
      drawCustomTriangle(this.verts);
    }
  });
}

function addKiteFilledOnly() {
  // i tried to color match the best i could:(
  const YELLOW = [1.0, 1.0, 0.5, 1.0];
  const CYAN   = [0.5, 1.0, 1.0, 1.0];
  const PINK   = [1.0, 0.5, 0.5, 1.0];
  // used numbersof triangles through trial and error
  const top    = [ 0.00,  0.80];
  const left   = [-0.65,  0.20];
  const right  = [ 0.65,  0.20];
  const bottom = [ 0.00, -0.35];

  const center = [0.00, 0.20];

  // top left triangle
  pushColoredTri([top[0],top[1], left[0],left[1], center[0],center[1]], YELLOW);
  // bottom left triangle
  pushColoredTri([left[0],left[1], bottom[0],bottom[1], center[0],center[1]], YELLOW);

  // top right triangle
  pushColoredTri([top[0],top[1], center[0],center[1], right[0],right[1]], CYAN);
  // bottom right triangle
  pushColoredTri([center[0],center[1], bottom[0],bottom[1], right[0],right[1]], CYAN);

  // smaller triangle on bottom
  const sTop    = [0.00, -0.45];
  const sLeft   = [-0.25, -0.65];
  const sRight  = [0.25, -0.65];
  const sBottom = [0.00, -0.85];
  const sCenter = [0.00, -0.65];

  // 4 triangles to fill the bottom
  pushColoredTri([sTop[0],sTop[1], sLeft[0],sLeft[1], sCenter[0],sCenter[1]], PINK);
  pushColoredTri([sTop[0],sTop[1], sCenter[0],sCenter[1], sRight[0],sRight[1]], PINK);
  pushColoredTri([sBottom[0],sBottom[1], sLeft[0],sLeft[1], sCenter[0],sCenter[1]], PINK);
  pushColoredTri([sBottom[0],sBottom[1], sCenter[0],sCenter[1], sRight[0],sRight[1]], PINK);
  const t = 0.1;
  const baseY = 0.05;
  const topY2 = 0.50;

  // Helper: one "stroke" = one triangle wedge from p1->p2 with thickness t
  function strokeTri(p1, p2, thick, col) {
    const x1 = p1[0], y1 = p1[1];
    const x2 = p2[0], y2 = p2[1];
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx*dx + dy*dy);
    if (len === 0) return;

    // perpendicular unit
    const px = -dy / len;
    const py =  dx / len;

    // make a skinny triangle: p1, p2, and p1 shifted perpendicular
    const x3 = x1 + px * thick;
    const y3 = y1 + py * thick;

    pushColoredTri([x1, y1, x2, y2, x3, y3], col);
  }

  const rL = -0.45;
  const rR = -0.15;
  const rMidY = 0.35;

  strokeTri([rL, baseY], [rL, topY2], t, CYAN);
  strokeTri([rL, topY2], [rR, topY2], t, CYAN);
  strokeTri([rL, rMidY], [rR - 0.05, rMidY], t, CYAN);
  strokeTri([rR, topY2], [rR, rMidY], t, CYAN);
  strokeTri([rL + 0.05, rMidY], [rR, baseY], t, CYAN);

  const wL = 0.10;
  const wR = 0.50;
  const wTop = topY2;
  const wBot1 = baseY;
  const wBot2 = baseY;

  const wDip1 = [0.20, wBot1];
  const wPeak = [0.30, wTop];
  const wDip2 = [0.40, wBot2];

  strokeTri([wL, wTop], wDip1, t, YELLOW);
  strokeTri(wDip1, wPeak, t, YELLOW);
  strokeTri(wPeak, wDip2, t, YELLOW);
  strokeTri(wDip2, [wR, wTop], t, YELLOW);

  renderAllShapes();
}


