//Clock by Dee Dee
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'void main() {\n' +
  '  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' +
  '}\n';

// number of slices.
var numSlices = 40;
// to be solid or not to be
var state ='hollow'
// seconds degrees
var secondDeg = 90;

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Write the positions of vertices to a vertex shader
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the positions of the vertices');
    return;
  }
  // Clear <canvas>
  //gl.clear(gl.COLOR_BUFFER_BIT);
  //draw(gl, numSlices);

    // Start drawing
    var draws;
    function drawie(){draws=setInterval(draw,1000, gl, numSlices)}
    drawie();
    
 // Register function (event handler) to be called on a mouse press
    canvas.onmousedown = function(ev){ click(ev, gl, canvas, a_Position); };
}

function initVertexBuffers(gl) {
    
    // Create a buffer object
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
      console.log('Failed to create the buffer object');
      return false;
    }
    
    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
      console.log('Failed to get the storage location of a_Position');
      return -1;
    }
    // Assign the buffer object to a_Position variable
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    
    // Enable the assignment to a_Position variable
    gl.enableVertexAttribArray(a_Position);
    
    return numSlices;
    }

function getCirclePoints(numS)
{
    var degrees = 360/numS;
    degrees=degrees*(Math.PI/180);
    var vertices = new Float32Array((numS*2)+2);
    var count = 0;
    for(x=0; x<=2*Math.PI; x=x+degrees)
    {
        vertices[count]=Math.cos(x);
        count++;
        vertices[count]=Math.sin(x);
        count++;
    }
    return vertices;
}

function drawCircle(gl, numS, flag, modelMatrix)
{
    var vertices = new Float32Array((numS*2)+2);
    vertices=getCirclePoints(numS);
    
    // Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);


    if(flag=='little')
    {
        modelMatrix.setScale(.05, .05, 1);    
    }
    else
    {
        modelMatrix.setScale(1, 1, 1);   
    }
 
    // Pass the model matrix to the vertex shader
    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage location of u_xformMatrix');
    return;
    }
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    gl.drawArrays(gl.LINE_LOOP, 0, vertices.length/2);
}

function createHand()
{
    var vertices = new Float32Array([
        0, 0,   .2, -0.1,   0.2, 0.1,   1,0
      ]);
    
    return vertices;
}

function drawHand(gl, modelMatrix, secondDeg)
{
    var vertices = new Float32Array(8);
    vertices=createHand();
    
    // Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    modelMatrix.setRotate(secondDeg,0,0,1);
    modelMatrix.scale(.65, .65, 1);
    

    
     // Pass the model matrix to the vertex shader
     var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
     if (!u_ModelMatrix) {
         console.log('Failed to get the storage location of u_xformMatrix');
     return;
    }
     gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

     gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertices.length/2);
}

function createHourSymbols()
{
    var vertices = new Float32Array([
        0, -.08,   1, -0.08,   0, 0.08,   1,0.08
      ]);
    
    return vertices;
}

function drawHourSymbols(gl, modelMatrix, degrees)
{
    var vertices = new Float32Array(8);
    vertices=createHourSymbols();

    // Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
    modelMatrix.setRotate(degrees,0,0,1);
    modelMatrix.translate(-1,0,0);
    modelMatrix.scale(.25, .25, 1);
         
    // Pass the model matrix to the vertex shader
    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage location of u_xformMatrix');
     return;
    }
     gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    
     gl.drawArrays(gl.LINES, 0, vertices.length/2);

}

function draw(gl, numS)
{

    // Create Matrix4 object for model transformation
    var modelMatrix = new Matrix4();

    // Specify the color for clearing <canvas>
    gl.clearColor(0, 0, 0, 1);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    drawCircle(gl, numS, 'little', modelMatrix);
    drawCircle(gl, numS, 'big', modelMatrix);

    drawHand(gl,modelMatrix,secondDeg);
    secondDeg=secondDeg-6;
    if(secondDeg<=-270)
    {
        console.log("here");
        secondDeg=90;
    }

    var deg = 360/12;
    var degToUse = 0;
    for(x=0; x<12; x++)
    {
        drawHourSymbols(gl, modelMatrix, degToUse);
        degToUse=degToUse+deg;
    }

}
