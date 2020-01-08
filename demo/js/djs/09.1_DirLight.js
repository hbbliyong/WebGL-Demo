/**
 * 平行光
 */
var VSHADER_SOURCE =
    `
	attribute vec3 a_Position;
	attribute vec3 aVertexNormal;
	attribute vec2 a_TextureCoordinates;
	
    uniform mat4   u_MVMatrix;
	uniform mat4   u_PMatrix;
	uniform mat3   uNMatrix;

	varying vec2   v_TextureCoordinates;
	varying vec3 v_NormalEye;
	varying vec3 v_PositionEye3;
    void main(){
		vec4 vertexPositionEye4=u_MVMatrix*vec4(a_Position,1.0);
		v_PositionEye3=vertexPositionEye4.xyz/vertexPositionEye4.w;
		//计算出法线向量
		v_NormalEye = normalize( uNMatrix * aVertexNormal);

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
	varying vec3 v_NormalEye;
	varying vec3 v_PositionEye3;

	uniform vec3 u_LightPosition;
	//环境光
	uniform vec3 u_AmbientLightColor;
	//漫反射光
	uniform vec3 u_DiffuseLightColor;
	//镜面反射光
	uniform vec3 u_SpecularLightColor;
    //聚光灯方向
    uniform vec3 uSpotDirection;
	uniform sampler2D u_Sampler;

	const float shininess=32.0;

    void main(){
		//通过点积算出光线的亮度权重
		vec3 n=normalize(v_NormalEye);
		vec3 l=normalize(u_LightPosition);
		float diffuseLightWeighting=max(0.0,dot(l,n));
		
		//将两个光源加到一起之后得到了当前的顶点的光照信息颜色
		vec3 lightWeighting=u_AmbientLightColor+u_DiffuseLightColor*diffuseLightWeighting;

		vec4 texelColor=texture2D(u_Sampler,v_TextureCoordinates);
        gl_FragColor=vec4(lightWeighting.rgb*texelColor.rgb,texelColor.a);
    }
`;
var gl;
var mat4 = glMatrix.mat4;

var pwgl = {};
pwgl.ongoingImageLoads = [];

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

    pwgl.vertexNormalAttributeLoc = gl.getAttribLocation(gl.program, "aVertexNormal");
    pwgl.uniformNormalMatrixLoc = gl.getUniformLocation(gl.program, "uNMatrix");
    pwgl.uniformLightPositionLoc = gl.getUniformLocation(gl.program, "u_LightPosition");
    pwgl.uniformAmbientLightColorLoc = gl.getUniformLocation(gl.program, "u_AmbientLightColor");
    pwgl.uniformDiffuseLightColorLoc = gl.getUniformLocation(gl.program, "u_DiffuseLightColor");
    pwgl.uniformSpecularLightColorLoc = gl.getUniformLocation(gl.program, "u_SpecularLightColor");
    pwgl.uniformSpotDirectionLoc = gl.getUniformLocation(gl.program, "uSpotDirection");
    // 设定为数组类型的变量数据
    gl.enableVertexAttribArray(pwgl.vertexPositionAttributeLoc);
    gl.enableVertexAttribArray(pwgl.vertexTextureAttributeLoc);
    gl.enableVertexAttribArray(pwgl.vertexNormalAttributeLoc);


    //初始化矩阵
    pwgl.modelViewMatrix = glMatrix.mat4.create();
    pwgl.projectionMatrix = glMatrix.mat4.create();
    modelViewMatrixStack = [];

    setupBuffers();

    setupLights();
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
        -5.0, 0.0, 5.0 //v3
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(floorVertexPosition), gl.STATIC_DRAW);
    pwgl.FLOOR_VERTEX_POS_BUF_ITEM_SIZE = 3;
    pwgl.FLOOR_VERTEX_POS_BUF_NUM_ITEMS = 4;

    //法线数据
    pwgl.floorVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.floorVertexNormalBuffer);

    let floorVertexNormals = [
        0.0, 1.0, 0.0, //v0
        0.0, 1.0, 0.0, //v1
        0.0, 1.0, 0.0, //v2
        0.0, 1.0, 0.0
    ]; //v3
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(floorVertexNormals), gl.STATIC_DRAW);

    pwgl.FLOOR_VERTEX_Normal_BUF_ITEM_SIZE = 3;
    pwgl.FLOOR_VERTEX_Normal_BUF_NUM_ITEMS = 4;
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

    //法线数据
    pwgl.cubeVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.cubeVertexNormalBuffer);

    var cubeVertexNormals = [
        // Front face
        0.0, 0.0, 1.0, //v0
        0.0, 0.0, 1.0, //v1
        0.0, 0.0, 1.0, //v2
        0.0, 0.0, 1.0, //v3

        // Back face
        0.0, 0.0, -1.0, //v4
        0.0, 0.0, -1.0, //v5
        0.0, 0.0, -1.0, //v6
        0.0, 0.0, -1.0, //v7

        // Left face
        -1.0, 0.0, 0.0, //v8
        -1.0, 0.0, 0.0, //v9
        -1.0, 0.0, 0.0, //v10
        -1.0, 0.0, 0.0, //v11

        // Right face
        1.0, 0.0, 0.0, //12
        1.0, 0.0, 0.0, //13
        1.0, 0.0, 0.0, //14
        1.0, 0.0, 0.0, //15

        // Top face
        0.0, 1.0, 0.0, //v16
        0.0, 1.0, 0.0, //v17
        0.0, 1.0, 0.0, //v18
        0.0, 1.0, 0.0, //v19

        // Bottom face
        0.0, -1.0, 0.0, //v20
        0.0, -1.0, 0.0, //v21
        0.0, -1.0, 0.0, //v22
        0.0, -1.0, 0.0, //v23
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVertexNormals), gl.STATIC_DRAW);

    pwgl.CUBE_VERTEX_NORMAL_BUF_ITEM_SIZE = 3;
    pwgl.CUBE_VERTEX_NORMAL_BUF_NUM_ITEMS = 24;

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

function setupLights() {
    gl.uniform3fv(pwgl.uniformLightPositionLoc, [.0, 10.0, -10.0]);
    gl.uniform3fv(pwgl.uniformAmbientLightColorLoc, [.3, .3, .3]);
    gl.uniform3fv(pwgl.uniformDiffuseLightColorLoc, [.9, .9, .9]);
    gl.uniform3fv(pwgl.uniformSpecularLightColorLoc, [.8, .8, .8]);

    gl.uniform3fv(pwgl.uniformSpotDirectionLoc, [0.0, -1.0, 0.0]);
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
    glMatrix.mat4.perspective(pwgl.projectionMatrix, 60 * Math.PI / 180, 1.0, 0.1, 100);
    //初始化模型视图矩阵
    glMatrix.mat4.identity(pwgl.modelViewMatrix);
    glMatrix.mat4.lookAt(pwgl.modelViewMatrix, [8, 5, -10], [0, 0, 0], [0, 1, 0]);

    uploadModelViewMatrixToShader();
    uploadProjectionMatrixToShader();
    uploadNormalMatrixToShader();
    gl.uniform1i(pwgl.uniformSamplerLoc, 0);

    drawFloor(1, 0, 0, 1);

    pushModelViewMatrix();
    glMatrix.mat4.translate(pwgl.modelViewMatrix, pwgl.modelViewMatrix, [0, 1.1, 0]);
    uploadModelViewMatrixToShader();
    uploadNormalMatrixToShader();
    drawTable();
    popModelViewMatrix();

    // 绘制桌子上的小盒子
    pushModelViewMatrix();
    glMatrix.mat4.translate(pwgl.modelViewMatrix, pwgl.modelViewMatrix, [0, 2.7, 0]);
    glMatrix.mat4.scale(pwgl.modelViewMatrix, pwgl.modelViewMatrix, [.5, .5, .5]);
    uploadModelViewMatrixToShader();
    uploadNormalMatrixToShader();
    drawCube(pwgl.boxTexture);
    popModelViewMatrix();
}

function render() {
    draw();
    console.log(gl.getError());
    requestAnimationFrame(render);
}

function uploadModelViewMatrixToShader() {
    gl.uniformMatrix4fv(pwgl.uniformMVMatrixLoc, false, pwgl.modelViewMatrix);
}

function uploadProjectionMatrixToShader() {
    gl.uniformMatrix4fv(pwgl.uniformProjMatrixLoc, false, pwgl.projectionMatrix);
}

function uploadNormalMatrixToShader() {
    let normalMatrix = glMatrix.mat3.create();
    glMatrix.mat3.fromMat4(normalMatrix, pwgl.modelViewMatrix);
    glMatrix.mat3.invert(normalMatrix, normalMatrix);
    glMatrix.mat3.transpose(normalMatrix, normalMatrix);
    gl.uniformMatrix3fv(pwgl.uniformNormalMatrixLoc, false, normalMatrix);
}

function drawFloor(r, g, b, a) {
    gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.floorVertexPositionBuffer);
    gl.vertexAttribPointer(pwgl.vertexPositionAttributeLoc, pwgl.FLOOR_VERTEX_POS_BUF_ITEM_SIZE, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.floorVertexTextureCoordinateBuffer);
    gl.vertexAttribPointer(pwgl.vertexTextureAttributeLoc, pwgl.FLOOR_VERTEX_TEX_COORD_BUF_ITEM_SIZE, gl.FLOAT, false, 0,
        0);

    //法线
    gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.floorVertexNormalBuffer);
    gl.vertexAttribPointer(pwgl.vertexNormalAttributeLoc, pwgl.FLOOR_VERTEX_Normal_BUF_ITEM_SIZE, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, pwgl.groundTexture);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pwgl.floorVertexIndexBuffer);
    gl.drawElements(gl.TRIANGLE_FAN, pwgl.FLOOR_VERTEX_INDEX_BUF_NUM_ITEMS, gl.UNSIGNED_SHORT, 0);
}

function drawTable() {
    pushModelViewMatrix();
    glMatrix.mat4.translate(pwgl.modelViewMatrix, pwgl.modelViewMatrix, [0.0, 1.0, 0.0]);
    glMatrix.mat4.scale(pwgl.modelViewMatrix, pwgl.modelViewMatrix, [2.0, 0.1, 2.0]);
    uploadModelViewMatrixToShader();
    uploadNormalMatrixToShader();
    //绘制桌面
    drawCube(pwgl.woodTexture);
    popModelViewMatrix();

    //绘制桌腿
    for (let i = -1; i <= 1; i += 2) {
        for (let j = -1; j <= 1; j += 2) {
            pushModelViewMatrix();
            glMatrix.mat4.translate(pwgl.modelViewMatrix, pwgl.modelViewMatrix, [i * 1.9, -0.1, j * 1.9]);
            glMatrix.mat4.scale(pwgl.modelViewMatrix, pwgl.modelViewMatrix, [.1, 1.0, .1]);
            uploadModelViewMatrixToShader();
            uploadNormalMatrixToShader();

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

    gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.cubeVertexNormalBuffer);
    gl.vertexAttribPointer(pwgl.vertexNormalAttributeLoc, pwgl.CUBE_VERTEX_NORMAL_BUF_ITEM_SIZE, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pwgl.cubeVertexIndexBuffer);
    gl.drawElements(gl.TRIANGLES, pwgl.CUBE_VERTEX_INDEX_BUF_NUM_ITEMS, gl.UNSIGNED_SHORT, 0);
}
// 将 modelViewMatrix 矩阵压入堆栈
function pushModelViewMatrix() {
    var copyToPush = glMatrix.mat4.clone(pwgl.modelViewMatrix);
    modelViewMatrixStack.push(copyToPush);
}

// 从矩阵堆栈中取出矩阵并设定为当前的 modelViewMatrix 矩阵
function popModelViewMatrix() {
    if (modelViewMatrixStack.length == 0) {
        throw "Error popModelViewMatrix() - Stack was empty ";
    }
    pwgl.modelViewMatrix = modelViewMatrixStack.pop();
}