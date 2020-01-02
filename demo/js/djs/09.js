var VSHADER_SOURCE = `
    attribute vec3 a_Position;
    attribute vec4 a_Color;
    uniform mat4   u_MVMatrix;
    uniform mat4   u_PMatrix;
    varying vec4   v_Color;
    void main(){
        gl_Position=u_PMatrix*u_MVMatrix*vec4(a_Position,1.0);
        v_Color=a_Color;
    }
`;

const FSHADER_SOURCE = `
    #ifdef GL_ES
    precision mediump float;
    #endif
    varying vec4 v_Color;
    void main(){
        gl_FragColor=v_Color;
    }
`;
var gl;

var floorVertexPositionBuffer;
var floorVertexIndexBuffer;
var cubeVertexPositionBuffer;
var cubeVertexIndexBuffer;

var modelViewMatrix;
var projectionMatrix;
var modelViewMatrixStack;

function main() {
    //const canvas = document.createElement('canvas');
    const vanvas = document.getElementById('canvas');
    canvas.width = 800;
    canvas.height = 800;

    gl = getWebGLContext(canvas);

 initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);
    //绘制底色
    gl.clearColor(0.0, 0.2, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    gl.program.vertexPositionAttribute = gl.getAttribLocation(gl.program, 'a_Position')
    gl.program.vertexColorAttribute = gl.getAttribLocation(gl.program, 'a_Color')
    gl.program.uniformMVMatrix = gl.getUniformLocation(gl.program, 'u_MVMatrix');
    gl.program.uniformProjMatrix = gl.getUniformLocation(gl.program, 'u_PMatrix');

 gl.enableVertexAttribArray(gl.program.vertexPositionAttribute);
    //初始化矩阵
    modelViewMatrix = glMatrix.mat4.create();
    projectionMatrix = glMatrix.mat4.create();
    modelViewMatrixStack = [];

    setupBuffers();
    draw();
   render();
}

function setupBuffers() {
    setupFloorBuffers();
   setupCubeBuffers();
}

function setupFloorBuffers() {
    floorVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, floorVertexPositionBuffer);
    let floorVertexPosition = [
        // Plane in y=0
        5.0, 0.0, 5.0, //v0
        5.0, 0.0, -5.0, //v1
        -5.0, 0.0, -5.0, //v2
        -5.0, 0.0, 5.0
    ]; //v3

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(floorVertexPosition), gl.STATIC_DRAW);
    floorVertexPositionBuffer.itemSize = 3;
    floorVertexPositionBuffer.numberOfItems = 4;

    floorVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, floorVertexIndexBuffer);
    let floorVertexIndices = [0, 1, 2, 3];
	
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(floorVertexIndices), gl.STATIC_DRAW);
    floorVertexIndexBuffer.itemSize = 1;
    floorVertexIndexBuffer.numberOfItems = 4;
}

function setupCubeBuffers() {
    cubeVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);

    var cubeVertexPosition = [
        // Front face
        1.0, 1.0, 1.0, //v0
        -1.0, 1.0, 1.0, //v1
        -1.0, -1.0, 1.0, //v2
        1.0, -1.0, 1.0, //v3

        // Back face
        1.0, 1.0, -1.0, //v4
        -1.0, 1.0, -1.0, //v5
        -1.0, -1.0, -1.0, //v6
        1.0, -1.0, -1.0, //v7

        // Left face
        -1.0, 1.0, 1.0, //v8
        -1.0, 1.0, -1.0, //v9
        -1.0, -1.0, -1.0, //v10
        -1.0, -1.0, 1.0, //v11

        // Right face
        1.0, 1.0, 1.0, //12
        1.0, -1.0, 1.0, //13
        1.0, -1.0, -1.0, //14
        1.0, 1.0, -1.0, //15

        // Top face
        1.0, 1.0, 1.0, //v16
        1.0, 1.0, -1.0, //v17
        -1.0, 1.0, -1.0, //v18
        -1.0, 1.0, 1.0, //v19

        // Bottom face
        1.0, -1.0, 1.0, //v20
        1.0, -1.0, -1.0, //v21
        -1.0, -1.0, -1.0, //v22
        -1.0, -1.0, 1.0, //v23
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVertexPosition), gl.STATIC_DRAW);
    cubeVertexPositionBuffer.itemSize = 3;
    cubeVertexPositionBuffer.numberOfItems = 24;

    cubeVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);

    var cubeVertexIndices = [
        0, 1, 2, 0, 2, 3, // Front face
        4, 6, 5, 4, 7, 6, // Back face
        8, 9, 10, 8, 10, 11, // Left face
        12, 13, 14, 12, 14, 15, // Right face
        16, 17, 18, 16, 18, 19, // Top face
        20, 22, 21, 20, 23, 22 // Bottom face
    ];

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
    cubeVertexIndexBuffer.itemSize = 1;
    cubeVertexIndexBuffer.numberOfItems = 36;
}

function draw() {
    glMatrix.mat4.perspective(projectionMatrix, 60 * Math.PI / 180,   1.0, 0.1, 100);
    //初始化模型视图矩阵
    glMatrix.mat4.identity(modelViewMatrix);
    glMatrix.mat4.lookAt(modelViewMatrix, [8, 5, -10], [0, 0, 0], [0, 1, 0]);

    uploadModelViewMatrixToShader();
    uploadProjectionMatrixToShader();

    drawFloor(1, 0, 0, 1);
	
	pushModelViewMatrix();
	glMatrix.mat4.translate(modelViewMatrix,modelViewMatrix,[0,1.1,0]);
	uploadModelViewMatrixToShader();
	drawTable();
	popModelViewMatrix();
	
	// 绘制桌子上的小盒子
	pushModelViewMatrix();
	glMatrix.mat4.translate(modelViewMatrix,modelViewMatrix,[0,2.7,0]);
	glMatrix.mat4.scale(modelViewMatrix,modelViewMatrix,[.5,.5,.5]);
	uploadModelViewMatrixToShader();
	drawCube(0,0,1,1);
	popModelViewMatrix();
}
function render(){
	draw();
	console.log(gl.getError());
	requestAnimationFrame(render);
}

function uploadModelViewMatrixToShader() {
    gl.uniformMatrix4fv(gl.program.uniformMVMatrix, false, modelViewMatrix);
}

function uploadProjectionMatrixToShader() {
    gl.uniformMatrix4fv(gl.program.uniformProjMatrix, false, projectionMatrix);
}

function drawFloor(r, g, b, a) {
    gl.disableVertexAttribArray(gl.program.vertexColorAttribute);
    gl.vertexAttrib4f(gl.program.vertexColorAttribute, r, g, b, a);

    gl.bindBuffer(gl.ARRAY_BUFFER, floorVertexPositionBuffer);
    gl.vertexAttribPointer(gl.program.vertexPositionAttribute, floorVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

   
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, floorVertexIndexBuffer);
    gl.drawElements(gl.TRIANGLE_FAN, floorVertexIndexBuffer.numberOfItems, gl.UNSIGNED_SHORT, 0);
}

function drawTable(){
	pushModelViewMatrix();
	glMatrix.mat4.translate(modelViewMatrix,modelViewMatrix,[0.0,1.0,0.0]);
	glMatrix.mat4.scale(modelViewMatrix,modelViewMatrix,[2.0,0.1,2.0]);
	uploadModelViewMatrixToShader();
	
	//绘制桌面
	drawCube(0.72,0.53,0.04,1.0);
	popModelViewMatrix();
	
	//绘制桌腿
	for (let i = -1; i <= 1; i+=2) {
		for (let j = -1; j <=1;j+=2) {
			pushModelViewMatrix();
			glMatrix.mat4.translate(modelViewMatrix,modelViewMatrix,[i*1.9,-0.1,j*1.9]);
			glMatrix.mat4.scale(modelViewMatrix,modelViewMatrix,[.1,1.0,.1]);
			uploadModelViewMatrixToShader();
			drawCube(.72,.53,.04,1.0);
			popModelViewMatrix();
		}
	}
	
}
function drawCube(r,g,b,a){
	gl.disableVertexAttribArray(gl.program.vertexColorAttribute);
	gl.vertexAttrib4f(gl.program.vertexColorAttribute,r,g,b,a);
	
	gl.bindBuffer(gl.ARRAY_BUFFER,cubeVertexPositionBuffer);
	gl.vertexAttribPointer(gl.program.vertexPositionAttribute,cubeVertexPositionBuffer.itemSize,gl.FLOAT,false,0,0);
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,cubeVertexIndexBuffer);
	gl.drawElements(gl.TRIANGLES,cubeVertexIndexBuffer.numberOfItems,gl.UNSIGNED_SHORT,0);
}
// 将 modelViewMatrix 矩阵压入堆栈
function pushModelViewMatrix() {
    var copyToPush = glMatrix.mat4.clone(modelViewMatrix);
    modelViewMatrixStack.push(copyToPush);
}

// 从矩阵堆栈中取出矩阵并设定为当前的 modelViewMatrix 矩阵
function popModelViewMatrix() {
    if (modelViewMatrixStack.length == 0) {
        throw "Error popModelViewMatrix() - Stack was empty ";
    }
    modelViewMatrix = modelViewMatrixStack.pop();
}