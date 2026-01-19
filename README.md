RYAN WONG
ryrwong@ucsc.edu

THE ASSIGNMENT IS DONE IN HelloPoint1.html and HelloPoint1.js

For most of the assignment, I followed the video tutorials. 

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

Used this website specifically for these functions. 

Some functions I got help from chatGPT, specifially these ones.

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

I also used chatGPT for these lines as well. 

