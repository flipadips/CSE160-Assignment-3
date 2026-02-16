class Camera {
  constructor() {
    this.fov = 60.0;
    this.eye = new Vector3([0, 0, 0]);
    this.at = new Vector3([0, 0, -1]);
    this.up = new Vector3([0, 1, 0]);
    
    this.viewMatrix = new Matrix4();
    this.projectionMatrix = new Matrix4();
    this.fov = 60.0;
    this.eye = new Vector3([0, 0, 0]);
    this.at = new Vector3([0, 0, -1]);
    this.up = new Vector3([0, 1, 0]);
    
    this.viewMatrix = new Matrix4();
    this.projectionMatrix = new Matrix4();
    
    // Add these for mouse rotation tracking
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.isRotating = false;
    
    this.updateMatrices();
  }

  updateMatrices() {
    this.viewMatrix.setLookAt(
      this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
      this.at.elements[0],  this.at.elements[1],  this.at.elements[2],
      this.up.elements[0],  this.up.elements[1],  this.up.elements[2]
    );
    this.projectionMatrix.setPerspective(this.fov, canvas.width/canvas.height, 0.1, 1000);
  }

  moveForward() {
      // Calculate forward direction
      var fx = this.at.elements[0] - this.eye.elements[0];
      var fy = this.at.elements[1] - this.eye.elements[1];
      var fz = this.at.elements[2] - this.eye.elements[2];
      
      // Normalize
      var len = Math.sqrt(fx*fx + fy*fy + fz*fz);
      fx /= len;
      fy /= len;
      fz /= len;
      
      // Apply speed
      var speed = 0.3;
      fx *= speed;
      fy *= speed;
      fz *= speed;
      
      // Move both eye and at
      this.eye.elements[0] += fx;
      this.eye.elements[1] += fy;
      this.eye.elements[2] += fz;
      
      this.at.elements[0] += fx;
      this.at.elements[1] += fy;
      this.at.elements[2] += fz;
      
      this.updateMatrices();
  }

back() {
    // Calculate backward direction (opposite of forward)
    var fx = this.at.elements[0] - this.eye.elements[0];
    var fy = this.at.elements[1] - this.eye.elements[1];
    var fz = this.at.elements[2] - this.eye.elements[2];
    
    // Normalize
    var len = Math.sqrt(fx*fx + fy*fy + fz*fz);
    fx /= len;
    fy /= len;
    fz /= len;
    
    // Apply speed (negative to go backward)
    var speed = -0.3;
    fx *= speed;
    fy *= speed;
    fz *= speed;
    
    // Move both eye and at
    this.eye.elements[0] += fx;
    this.eye.elements[1] += fy;
    this.eye.elements[2] += fz;
    
    this.at.elements[0] += fx;
    this.at.elements[1] += fy;
    this.at.elements[2] += fz;
    
    this.updateMatrices();
}

  moveLeft() {
      // Calculate forward direction
      var fx = this.at.elements[0] - this.eye.elements[0];
      var fy = this.at.elements[1] - this.eye.elements[1];
      var fz = this.at.elements[2] - this.eye.elements[2];
      
      // Calculate right vector (cross product of forward and up)
      var rx = fy * this.up.elements[2] - fz * this.up.elements[1];
      var ry = fz * this.up.elements[0] - fx * this.up.elements[2];
      var rz = fx * this.up.elements[1] - fy * this.up.elements[0];
      
      // Normalize right vector
      var len = Math.sqrt(rx*rx + ry*ry + rz*rz);
      rx /= len;
      ry /= len;
      rz /= len;
      
      // Apply speed (negative to go left)
      var speed = -0.3;
      rx *= speed;
      ry *= speed;
      rz *= speed;
      
      // Move both eye and at
      this.eye.elements[0] += rx;
      this.eye.elements[1] += ry;
      this.eye.elements[2] += rz;
      
      this.at.elements[0] += rx;
      this.at.elements[1] += ry;
      this.at.elements[2] += rz;
      
      this.updateMatrices();
  }
  
  moveRight() {
      // Calculate forward direction
      var fx = this.at.elements[0] - this.eye.elements[0];
      var fy = this.at.elements[1] - this.eye.elements[1];
      var fz = this.at.elements[2] - this.eye.elements[2];
      
      // Calculate right vector (cross product of forward and up)
      var rx = fy * this.up.elements[2] - fz * this.up.elements[1];
      var ry = fz * this.up.elements[0] - fx * this.up.elements[2];
      var rz = fx * this.up.elements[1] - fy * this.up.elements[0];
      
      // Normalize right vector
      var len = Math.sqrt(rx*rx + ry*ry + rz*rz);
      rx /= len;
      ry /= len;
      rz /= len;
      
      // Apply speed (positive to go right)
      var speed = 0.3;
      rx *= speed;
      ry *= speed;
      rz *= speed;
      
      // Move both eye and at
      this.eye.elements[0] += rx;
      this.eye.elements[1] += ry;
      this.eye.elements[2] += rz;
      
      this.at.elements[0] += rx;
      this.at.elements[1] += ry;
      this.at.elements[2] += rz;
      
      this.updateMatrices();
  }

  panLeft() {
    // Calculate forward direction
    var fx = this.at.elements[0] - this.eye.elements[0];
    var fy = this.at.elements[1] - this.eye.elements[1];
    var fz = this.at.elements[2] - this.eye.elements[2];
    
    // Create a rotation matrix to rotate around the up vector
    var alpha = 5; // degrees to rotate (adjust as needed)
    var rotationMatrix = new Matrix4();
    rotationMatrix.setRotate(alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
    
    // Create a Vector3 from f
    var f = new Vector3([fx, fy, fz]);
    
    // Multiply the rotation matrix by f to get f_prime
    var f_prime = rotationMatrix.multiplyVector3(f);
    
    // Update at = eye + f_prime
    this.at.elements[0] = this.eye.elements[0] + f_prime.elements[0];
    this.at.elements[1] = this.eye.elements[1] + f_prime.elements[1];
    this.at.elements[2] = this.eye.elements[2] + f_prime.elements[2];
    
    this.updateMatrices();
}

  panRight() {
      // Calculate forward direction
      var fx = this.at.elements[0] - this.eye.elements[0];
      var fy = this.at.elements[1] - this.eye.elements[1];
      var fz = this.at.elements[2] - this.eye.elements[2];
      
      // Create a rotation matrix to rotate around the up vector (negative angle)
      var alpha = -5; // degrees to rotate (adjust as needed)
      var rotationMatrix = new Matrix4();
      rotationMatrix.setRotate(alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
      
      // Create a Vector3 from f
      var f = new Vector3([fx, fy, fz]);
      
      // Multiply the rotation matrix by f to get f_prime
      var f_prime = rotationMatrix.multiplyVector3(f);
      
      // Update at = eye + f_prime
      this.at.elements[0] = this.eye.elements[0] + f_prime.elements[0];
      this.at.elements[1] = this.eye.elements[1] + f_prime.elements[1];
      this.at.elements[2] = this.eye.elements[2] + f_prime.elements[2];
      
      this.updateMatrices();
  }

  panByMouse(deltaX, deltaY) {
    // Horizontal rotation (left/right) - rotate around up vector
    if (deltaX !== 0) {
        // Calculate forward direction
        var fx = this.at.elements[0] - this.eye.elements[0];
        var fy = this.at.elements[1] - this.eye.elements[1];
        var fz = this.at.elements[2] - this.eye.elements[2];
        
        // Sensitivity - adjust this to control rotation speed
        var sensitivity = 0.3;
        var alpha = -deltaX * sensitivity; // negative for intuitive direction
        
        // Create rotation matrix around up vector
        var rotationMatrix = new Matrix4();
        rotationMatrix.setRotate(alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        
        // Create Vector3 and rotate
        var f = new Vector3([fx, fy, fz]);
        var f_prime = rotationMatrix.multiplyVector3(f);
        
        // Update at position
        this.at.elements[0] = this.eye.elements[0] + f_prime.elements[0];
        this.at.elements[1] = this.eye.elements[1] + f_prime.elements[1];
        this.at.elements[2] = this.eye.elements[2] + f_prime.elements[2];
    }
    
    // Vertical rotation (up/down) - rotate around right vector
    if (deltaY !== 0) {
        // Calculate forward direction
        var fx = this.at.elements[0] - this.eye.elements[0];
        var fy = this.at.elements[1] - this.eye.elements[1];
        var fz = this.at.elements[2] - this.eye.elements[2];
        
        // Calculate right vector (cross product of forward and up)
        var rx = fy * this.up.elements[2] - fz * this.up.elements[1];
        var ry = fz * this.up.elements[0] - fx * this.up.elements[2];
        var rz = fx * this.up.elements[1] - fy * this.up.elements[0];
        
        // Normalize right vector
        var len = Math.sqrt(rx*rx + ry*ry + rz*rz);
        rx /= len;
        ry /= len;
        rz /= len;
        
        // Sensitivity
        var sensitivity = 0.3;
        var beta = -deltaY * sensitivity;
        
        // Create rotation matrix around right vector
        var rotationMatrix = new Matrix4();
        rotationMatrix.setRotate(beta, rx, ry, rz);
        
        // Create Vector3 and rotate
        var f = new Vector3([fx, fy, fz]);
        var f_prime = rotationMatrix.multiplyVector3(f);
        
        // Update at position
        this.at.elements[0] = this.eye.elements[0] + f_prime.elements[0];
        this.at.elements[1] = this.eye.elements[1] + f_prime.elements[1];
        this.at.elements[2] = this.eye.elements[2] + f_prime.elements[2];
    }
    
    this.updateMatrices();
}
}