class Sphere {
    constructor(){
        this.type = "sphere";
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.segments = 16;
    }

    render(){
        var rgba = this.color;
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        // sphere vertices
        var vertices = [];
        var latitudeBands = this.segments;
        var longitudeBands = this.segments;

        // vertices for spheres
        for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
            var theta = latNumber * Math.PI / latitudeBands;
            var sinTheta = Math.sin(theta);
            var cosTheta = Math.cos(theta);

            for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
                var phi = longNumber * 2 * Math.PI / longitudeBands;
                var sinPhi = Math.sin(phi);
                var cosPhi = Math.cos(phi);

                var x = cosPhi * sinTheta;
                var y = cosTheta;
                var z = sinPhi * sinTheta;

                vertices.push(x * 0.5, y * 0.5, z * 0.5);
            }
        }

        // draw triangles for the sphere eyes
        for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
            for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
                var first = (latNumber * (longitudeBands + 1)) + longNumber;
                var second = first + longitudeBands + 1;

                var i1 = first * 3;
                var i2 = second * 3;
                var i3 = (first + 1) * 3;

                drawTriangle3D([
                    vertices[i1], vertices[i1 + 1], vertices[i1 + 2],
                    vertices[i2], vertices[i2 + 1], vertices[i2 + 2],
                    vertices[i3], vertices[i3 + 1], vertices[i3 + 2]
                ]);

                i1 = second * 3;
                i2 = (second + 1) * 3;
                i3 = (first + 1) * 3;

                drawTriangle3D([
                    vertices[i1], vertices[i1 + 1], vertices[i1 + 2],
                    vertices[i2], vertices[i2 + 1], vertices[i2 + 2],
                    vertices[i3], vertices[i3 + 1], vertices[i3 + 2]
                ]);
            }
        }
    }
}