const VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    attribute vec4 a_Normal;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_NormalMatrix;
    uniform vec3 u_LightColor;
    uniform vec3 u_LightDirection;
    uniform vec3 u_AmbientLight;
    varying vec4 v_Color;
    
    void main(){
        gl_Position=u_MvpMatrix*a_Position;
        vec3 normal=normalize(vec3(u_NormalMatrix*a_Normal));
        float nDotL=max(dot(u_LightDirection,normal),0.0);
        vec3 diffuse=u_LightColor *vec3(a_Color)*nDotL;
        vec3 ambient=u_AmbientLight*a_Color.rgb;
        v_Color=vec4(diffuse+ambient,a_Color.a);
    }
`

var FSHADER_SOURCE = `
    #ifdef GL_ES
    precision mediump float;
    #endif

    varying vec4 v_Color;
    void main(){
        gl_FragColor=v_Color;
    }
`;


main();
function main() {
    const canvas = document.querySelector('#glcanvas');

    var gl = getWebGLContext(canvas);

    initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);

    var n = initVertexBuffers(gl);

    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.DEPTH_TEST);

    var u_MvpMatrix = gl.getUniformLocation(gl.program, "u_MvpMatrix");
    var u_LightColor = gl.getUniformLocation(gl.program, "u_LightColor");
    var u_LightDirection = gl.getUniformLocation(gl.program, "u_LightDirection");
    var u_AmbientLight = gl.getUniformLocation(gl.program, "u_AmbientLight");
    var u_NormalMatrix = gl.getUniformLocation(gl.program, "u_NormalMatrix");
    if (!u_MvpMatrix || !u_LightColor || !u_LightDirection || !u_AmbientLight || !u_NormalMatrix) {
        console.log("无法获取相关的存储位置，或者未定义");
        return;
    }

    gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
    var lightDirection = new Vector3([.5, 3.0, 4.0]);
    lightDirection.normalize();
    gl.uniform3fv(u_LightDirection, lightDirection.elements);

    gl.uniform3f(u_AmbientLight, .2, .2, .2);

    var mvpMatrix = new Matrix4();
    var modelMatrix = new Matrix4(); //模型矩阵
    var normalMatrix = new Matrix4(); //用来变换法向量的矩阵

    //计算矩阵
    mvpMatrix.setPerspective(30, canvas.width / canvas.height, 1, 100); //设置透视矩阵
    mvpMatrix.lookAt(3, 3, 7, 0, 0, 0, 0, 1, 0); //设置视点的位置

    modelMatrix.setTranslate(0, 0.5, 0); //沿Y轴平移
    modelMatrix.rotate(60, 30, 0, 1); //绕Z轴旋转

    mvpMatrix.multiply(modelMatrix);


    //将模型视图投影矩阵传给u_MvpMatrix变量
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

    //根据模型矩阵计算用来变换法向量的矩阵
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    //将用来变换放下了的矩阵传给u_NormalMatrix变量
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    //清除底色和深度缓冲区
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0); //绘制图形


}

function initVertexBuffers(gl) {
    // 绘制一个立方体
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3
    var vertices = new Float32Array([ // 顶点坐标
        1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, // v0-v1-v2-v3 front
        1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, // v0-v3-v4-v5 right
        1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, // v0-v5-v6-v1 up
        -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, // v1-v6-v7-v2 left
        -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0, // v7-v4-v3-v2 down
        1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0 // v4-v7-v6-v5 back
    ]);


    var colors = new Float32Array([ // 顶点颜色
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, // v0-v1-v2-v3 front
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, // v0-v3-v4-v5 right
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, // v0-v5-v6-v1 up
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, // v1-v6-v7-v2 left
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, // v7-v4-v3-v2 down
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0　 // v4-v7-v6-v5 back
    ]);

    var normals = new Float32Array([ // 法向量
        0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, // v0-v1-v2-v3 front
        1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, // v0-v3-v4-v5 right
        0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // v0-v5-v6-v1 up
        -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // v1-v6-v7-v2 left
        0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, // v7-v4-v3-v2 down
        0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0 // v4-v7-v6-v5 back
    ]);


    // 绘制点的顺序下标
    var indices = new Uint8Array([
        0, 1, 2, 0, 2, 3, // front
        4, 5, 6, 4, 6, 7, // right
        8, 9, 10, 8, 10, 11, // up
        12, 13, 14, 12, 14, 15, // left
        16, 17, 18, 16, 18, 19, // down
        20, 21, 22, 20, 22, 23 // back
    ]);


    // 通过initArrayBuffer方法将顶点数据保存到缓冲区
    if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

    // 创建顶点索引缓冲区对象
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('无法创建顶点索引的缓冲区对象');
        return -1;
    }

    //将顶点索引数据存入缓冲区
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return indices.length;
}

function initArrayBuffer(gl, attribute, data, num, type) {
    //创建缓冲区对象
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log("无法创建缓冲区对象");
        return false;
    }
    //绑定缓冲区，并将数据存入缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    //获取相关变量存储位置，赋值并开启缓冲区
    var a_attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_attribute < 0) {
        console.log("无法获取" + attribute + "变量的相关位置");
        return false;
    }

    //向缓冲区赋值
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);

    //开启数据，并解绑缓冲区
    gl.enableVertexAttribArray(a_attribute);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return true;
}