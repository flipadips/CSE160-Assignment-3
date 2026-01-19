// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    //gl_PointSize = 10.0;
    gl_PointSize = u_Size;
  }`

// Fragment shader program
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
let u_Size;

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

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if(!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Global Variables to UI
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_SelectedSize = 5;
let g_selectedType = POINT;
let g_selectedSegments = 10;

function AddActionsForHtmlUI() {
  document.getElementById('Green').onclick = function() {g_selectedColor = [0.0, 1.0, 0.0, 1.0]; };
  document.getElementById('Red').onclick = function() {g_selectedColor = [1.0, 0.0, 0.0, 1.0]; };
  document.getElementById('clearButton').onclick = function() {g_shapesList = []; renderAllShapes()};

  document.getElementById('redSlide').addEventListener('mouseup', function() {g_selectedColor[0] = this.value/100;});
  document.getElementById('greenSlide').addEventListener('mouseup', function() {g_selectedColor[1] = this.value/100;});
  document.getElementById('blueSlide').addEventListener('mouseup', function() {g_selectedColor[2] = this.value/100;});

  document.getElementById('sizeSlide').addEventListener('mouseup', function() {g_SelectedSize = this.value;});
  document.getElementById('pointButton').onclick = function() {g_selectedType=POINT};
  document.getElementById('triButton').onclick = function() {g_selectedType=TRIANGLE};
  document.getElementById('circleButton').onclick = function() {g_selectedType=CIRCLE};
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
  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  canvas.onmousemove = function(ev) {if(ev.buttons == 1) {click(ev)}};

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
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
  // Store the coordinates to g_points array
  // g_points.push([x, y]);
  // g_colors.push(g_selectedColor);
  // g_colors.push(g_selectedColor.slice());
  // g_sizes.push(g_SelectedSize);

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
    // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  // var len = g_points.length;
  var len = g_shapesList.length;
  for(var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }
  var duration = performance.now() - startTime;
  sendTextToHtml("numdot: " + len + " ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot");
  
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


