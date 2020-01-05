var VSHADER_SOURCE =
	`
    attribute vec3 a_Position;
    attribute vec2 a_TextureCoordinates;
    uniform mat4   u_MVMatrix;
    uniform mat4   u_PMatrix;
    varying vec2   v_TextureCoordinates;
    void main(){
        gl_Position=u_PMatrix*u_MVMatrix*vec4(a_Position,1.0);
        v_TextureCoordinates=a_TextureCoordinates;
    }
`;

const FSHADER_SOURCE =
	`
    #ifdef GL_ES
    precision mediump float;
    #endif
    varying vec2 v_TextureCoordinates;
	uniform sampler2D u_Sampler;
    void main(){
        gl_FragColor=texture2D(u_Sampler,v_TextureCoordinates);
    }
`;
var gl;
var mat4 = glMatrix.mat4;

var pwgl = {};
pwgl.ongoingImageLoads = [];

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


	gl = getWebGLContext(canvas);

	initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);
	//绘制底色
	gl.clearColor(0.0, 0.2, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.enable(gl.DEPTH_TEST);

	// 获取属性位置
	pwgl.vertexPositionAttributeLoc = gl.getAttribLocation(gl.program, "a_Position");
	pwgl.vertexTextureAttributeLoc = gl.getAttribLocation(gl.program, "a_TextureCoordinates");
	pwgl.uniformMVMatrixLoc = gl.getUniformLocation(gl.program, "u_MVMatrix");
	pwgl.uniformProjMatrixLoc = gl.getUniformLocation(gl.program, "u_PMatrix");
	pwgl.uniformSamplerLoc = gl.getUniformLocation(gl.program, "u_Sampler");

	// 设定为数组类型的变量数据
	gl.enableVertexAttribArray(pwgl.vertexPositionAttributeLoc);
	gl.enableVertexAttribArray(pwgl.vertexTextureAttributeLoc);


	//初始化矩阵
	modelViewMatrix = glMatrix.mat4.create();
	projectionMatrix = glMatrix.mat4.create();
	modelViewMatrixStack = [];

	setupBuffers();
	setupTextures();
	draw();
	render();
}

function setupBuffers() {
	setupFloorBuffers();
	setupCubeBuffers();
}

function setupFloorBuffers() {
	pwgl.floorVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.floorVertexPositionBuffer);
	let floorVertexPosition = [
		// Plane in y=0
		5.0, 0.0, 5.0, //v0
		5.0, 0.0, -5.0, //v1
		-5.0, 0.0, -5.0, //v2
		-5.0, 0.0, 5.0
	]; //v3

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(floorVertexPosition), gl.STATIC_DRAW);
	pwgl.FLOOR_VERTEX_POS_BUF_ITEM_SIZE = 3;
	pwgl.FLOOR_VERTEX_POS_BUF_NUM_ITEMS = 4;

	//UV数据
	pwgl.floorVertexTextureCoordinateBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.floorVertexTextureCoordinateBuffer);
	let floorVertexTextureCoordinates = [
		2.0, 0.0,
		2.0, 2.0,
		0.0, 2.0,
		0.0, 0.0
	];

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(floorVertexTextureCoordinates), gl.STATIC_DRAW);
	pwgl.FLOOR_VERTEX_TEX_COORD_BUF_ITEM_SIZE = 2;
	pwgl.FLOOR_VERTEX_TEX_COORD_BUF_NUM_ITEMS = 4;

	// 索引数据
	pwgl.floorVertexIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pwgl.floorVertexIndexBuffer);
	let floorVertexIndices = [0, 1, 2, 3];

	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(floorVertexIndices), gl.STATIC_DRAW);
	pwgl.FLOOR_VERTEX_INDEX_BUF_ITEM_SIZE = 1;
	pwgl.FLOOR_VERTEX_INDEX_BUF_NUM_ITEMS = 4;
}

function setupCubeBuffers() {
	pwgl.cubeVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.cubeVertexPositionBuffer);

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
	pwgl.CUBE_VERTEX_POS_BUF_ITEM_SIZE = 3;
	pwgl.CUBE_VERTEX_POS_BUF_NUM_ITEMS = 24;

	//UV数据
	pwgl.cubeVertexTextureCoordinateBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.cubeVertexTextureCoordinateBuffer);

	var textureCoordinates = [
		//Front face
		0.0, 0.0, //v0
		1.0, 0.0, //v1
		1.0, 1.0, //v2
		0.0, 1.0, //v3

		// Back face
		0.0, 1.0, //v4
		1.0, 1.0, //v5
		1.0, 0.0, //v6
		0.0, 0.0, //v7

		// Left face
		0.0, 1.0, //v8
		1.0, 1.0, //v9
		1.0, 0.0, //v10
		0.0, 0.0, //v11

		// Right face
		0.0, 1.0, //v12
		1.0, 1.0, //v13
		1.0, 0.0, //v14
		0.0, 0.0, //v15

		// Top face
		0.0, 1.0, //v16
		1.0, 1.0, //v17
		1.0, 0.0, //v18
		0.0, 0.0, //v19

		// Bottom face
		0.0, 1.0, //v20
		1.0, 1.0, //v21
		1.0, 0.0, //v22
		0.0, 0.0, //v23
	];

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);

	pwgl.CUBE_VERTEX_TEX_COORD_BUF_ITEM_SIZE = 2;
	pwgl.CUBE_VERTEX_TEX_COORD_BUF_NUM_ITEMS = 24;

	pwgl.cubeVertexIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pwgl.cubeVertexIndexBuffer);

	var cubeVertexIndices = [
		0, 1, 2, 0, 2, 3, // Front face
		4, 6, 5, 4, 7, 6, // Back face
		8, 9, 10, 8, 10, 11, // Left face
		12, 13, 14, 12, 14, 15, // Right face
		16, 17, 18, 16, 18, 19, // Top face
		20, 22, 21, 20, 23, 22 // Bottom face
	];

	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
	pwgl.CUBE_VERTEX_INDEX_BUF_ITEM_SIZE = 1;
	pwgl.CUBE_VERTEX_INDEX_BUF_NUM_ITEMS = 36;
}

function setupTextures() {
	pwgl.woodTexture = gl.createTexture();
	loadImageForTexture("wood_128x128.jpg", pwgl.woodTexture);

	pwgl.groundTexture = gl.createTexture();
	loadImageForTexture("wood_floor_256.jpg", pwgl.groundTexture);

	pwgl.boxTexture = gl.createTexture();
	loadImageForTexture("wicker_256.jpg", pwgl.boxTexture);
}

function loadImageForTexture(url, texture) {
	let image = new Image();
	image.onload = function() {
		pwgl.ongoingImageLoads.splice(pwgl.ongoingImageLoads.indexOf(image), 1);
		textureFinishedLoading(image, texture);
	}
	pwgl.ongoingImageLoads.push(image);
	image.src = '../resources/imgs/' + url;
}

function textureFinishedLoading(image, texture) {
	//指定当前操作的贴图
	gl.bindTexture(gl.TEXTURE_2D, texture);
	//Y轴取反
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

	//创建贴图,确定对应的图像并设置数据格式
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

	//生成MipMap映射
	gl.generateMipmap(gl.TEXTURE_2D);

	//设定参数,放大滤镜和缩小滤镜的采样方式
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

	// 设定参数, x 轴和 y 轴为镜面重复绘制
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);

	//清除当前操作的贴图
	gl.bindTexture(gl.TEXTURE_2D, null);
}

function draw() {
	glMatrix.mat4.perspective(projectionMatrix, 60 * Math.PI / 180, 1.0, 0.1, 100);
	//初始化模型视图矩阵
	glMatrix.mat4.identity(modelViewMatrix);
	glMatrix.mat4.lookAt(modelViewMatrix, [8, 5, -10], [0, 0, 0], [0, 1, 0]);

	uploadModelViewMatrixToShader();
	uploadProjectionMatrixToShader();
	gl.uniform1i(pwgl.uniformSamplerLoc, 0);
	drawFloor(1, 0, 0, 1);

	pushModelViewMatrix();
	glMatrix.mat4.translate(modelViewMatrix, modelViewMatrix, [0, 1.1, 0]);
	uploadModelViewMatrixToShader();
	drawTable();
	popModelViewMatrix();

	// 绘制桌子上的小盒子
	pushModelViewMatrix();
	glMatrix.mat4.translate(modelViewMatrix, modelViewMatrix, [0, 2.7, 0]);
	glMatrix.mat4.scale(modelViewMatrix, modelViewMatrix, [.5, .5, .5]);
	uploadModelViewMatrixToShader();
	drawCube(pwgl.boxTexture);
	popModelViewMatrix();
}

function render() {
	draw();
	console.log(gl.getError());
	requestAnimationFrame(render);
}

function uploadModelViewMatrixToShader() {
	gl.uniformMatrix4fv(pwgl.uniformMVMatrixLoc, false, modelViewMatrix);
}

function uploadProjectionMatrixToShader() {
	gl.uniformMatrix4fv(pwgl.uniformProjMatrixLoc, false, projectionMatrix);
}

function drawFloor(r, g, b, a) {
	gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.floorVertexPositionBuffer);
	gl.vertexAttribPointer(pwgl.vertexPositionAttributeLoc, pwgl.FLOOR_VERTEX_POS_BUF_ITEM_SIZE, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.floorVertexTextureCoordinateBuffer);
	gl.vertexAttribPointer(pwgl.vertexTextureAttributeLoc, pwgl.FLOOR_VERTEX_TEX_COORD_BUF_ITEM_SIZE, gl.FLOAT, false, 0,
		0);


	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, pwgl.groundTexture);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pwgl.floorVertexIndexBuffer);
	gl.drawElements(gl.TRIANGLE_FAN, pwgl.FLOOR_VERTEX_INDEX_BUF_NUM_ITEMS, gl.UNSIGNED_SHORT, 0);
}

function drawTable() {
	pushModelViewMatrix();
	glMatrix.mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 1.0, 0.0]);
	glMatrix.mat4.scale(modelViewMatrix, modelViewMatrix, [2.0, 0.1, 2.0]);
	uploadModelViewMatrixToShader();

	//绘制桌面
	drawCube(pwgl.woodTexture);
	popModelViewMatrix();

	//绘制桌腿
	for (let i = -1; i <= 1; i += 2) {
		for (let j = -1; j <= 1; j += 2) {
			pushModelViewMatrix();
			glMatrix.mat4.translate(modelViewMatrix, modelViewMatrix, [i * 1.9, -0.1, j * 1.9]);
			glMatrix.mat4.scale(modelViewMatrix, modelViewMatrix, [.1, 1.0, .1]);
			uploadModelViewMatrixToShader();
			drawCube(pwgl.woodTexture);
			popModelViewMatrix();
		}
	}
}

function drawCube(texture) {
	gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.cubeVertexPositionBuffer);
	gl.vertexAttribPointer(pwgl.vertexPositionAttributeLoc, pwgl.CUBE_VERTEX_POS_BUF_ITEM_SIZE, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.cubeVertexTextureCoordinateBuffer);
	gl.vertexAttribPointer(pwgl.vertexTextureAttributeLoc, pwgl.CUBE_VERTEX_TEX_COORD_BUF_ITEM_SIZE, gl.FLOAT, false, 0, 0);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pwgl.cubeVertexIndexBuffer);
	gl.drawElements(gl.TRIANGLES, pwgl.CUBE_VERTEX_INDEX_BUF_NUM_ITEMS, gl.UNSIGNED_SHORT, 0);
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
