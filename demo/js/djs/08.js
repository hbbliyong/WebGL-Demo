var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec4 a_Normal;
    uniform mat4   u_MvpMatrix;
    uniform mat4   u_NormalMatrix;
    varying vec4   v_Color;
    void main(){
        gl_Position=u_MvpMatrix*a_Position;
        vec3 lightDirection=normalize(vec3(.0,.5,.7));
        vec4 color=vec4(1.0,.4,0.0,1.0);
        vec3 normal=normalize((u_NormalMatrix*a_Normal).xyz);
        float nDotL=max(dot(normal,lightDirection),0.0);
        v_Color=vec4(color.rgb*nDotL+vec3(0.1),color.a);
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

function main() {
    //const canvas = document.createElement('canvas');
    const vanvas = document.getElementById('canvas');
    canvas.width = 800;
    canvas.height = 800;

    var gl = getWebGLContext(canvas);

    initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);

    var n = initVertexBuffers(gl); //

    gl.clearColor(.0, .0, .0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');

    var viewProjMatrix = new Matrix4();
    viewProjMatrix.setPerspective(50.0, canvas.width / canvas.height, 1.0, 100.0);
    viewProjMatrix.lookAt(20.0, 10.0, 30.0, .0, .0, .0, .0, 1.0, 0);

    document.onkeydown = function(e) {
        keydown(e, gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
    };

    draw(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
}

//声明全局变量
var angle_step = 3.0; //每一次点击触发事件旋转角度（度）的增量
var g_arm1Angle = -90.0; //arm1的旋转角度（度）
var g_joint1Angle = -45.0; //joint1的旋转角度（度
var g_joint2Angle = 0.0; //joint2的当前角度
var g_joint3Angle = 0.0; //joint3的当前角度



function keydown(event, gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
    switch (event.keyCode) {
        case 38: // 上键 -> 以joint1为中心沿着z轴旋转（增量）
            if (g_joint1Angle < 135.0) g_joint1Angle += angle_step;
            break;
        case 40: // 下键 -> 以joint1为中心沿着z轴旋转（减量）
            if (g_joint1Angle > -135.0) g_joint1Angle -= angle_step;
            break;
        case 39: // 右键 -> 以y轴进行水平旋转（增量）
            g_arm1Angle = (g_arm1Angle + angle_step) % 360;
            break;
        case 37: // 左键 -> 以y轴进行水平旋转（减量）
            g_arm1Angle = (g_arm1Angle - angle_step) % 360;
            break;
        default:
            return; // 其他按键没作用
    }

    draw(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
}

function initVertexBuffers(gl) {
    // Vertex coordinates（长方体3宽度，高度10，长度3，其原点在其底部）
    var vertices = new Float32Array([
        0.5, 1.0, 0.5, -0.5, 1.0, 0.5, -0.5, 0.0, 0.5, 0.5, 0.0, 0.5, // v0-v1-v2-v3 front
        0.5, 1.0, 0.5, 0.5, 0.0, 0.5, 0.5, 0.0, -0.5, 0.5, 1.0, -0.5, // v0-v3-v4-v5 right
        0.5, 1.0, 0.5, 0.5, 1.0, -0.5, -0.5, 1.0, -0.5, -0.5, 1.0, 0.5, // v0-v5-v6-v1 up
        -0.5, 1.0, 0.5, -0.5, 1.0, -0.5, -0.5, 0.0, -0.5, -0.5, 0.0, 0.5, // v1-v6-v7-v2 left
        -0.5, 0.0, -0.5, 0.5, 0.0, -0.5, 0.5, 0.0, 0.5, -0.5, 0.0, 0.5, // v7-v4-v3-v2 down
        0.5, 0.0, -0.5, -0.5, 0.0, -0.5, -0.5, 1.0, -0.5, 0.5, 1.0, -0.5 // v4-v7-v6-v5 back

    ]);
    // Normal
    var normals = new Float32Array([
        0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, // v0-v1-v2-v3 front
        1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, // v0-v3-v4-v5 right
        0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // v0-v5-v6-v1 up
        -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // v1-v6-v7-v2 left
        0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, // v7-v4-v3-v2 down
        0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0 // v4-v7-v6-v5 back
    ]);

    // Indices of the vertices
    var indices = new Uint8Array([
        0, 1, 2, 0, 2, 3, // front
        4, 5, 6, 4, 6, 7, // right
        8, 9, 10, 8, 10, 11, // up
        12, 13, 14, 12, 14, 15, // left
        16, 17, 18, 16, 18, 19, // down
        20, 21, 22, 20, 22, 23 // back
    ]);

    if (!initArrayBuffer(gl, "a_Position", vertices, gl.FLOAT, 3)) return -1;
    if (!initArrayBuffer(gl, "a_Normal", normals, gl.FLOAT, 3)) return -1;

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return indices.length;
}

function initArrayBuffer(gl, attribute, data, type, num) {
    //创建缓冲区
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log("无法创建缓冲区");
        return false;
    }

    //将数据写入缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    //获取到attribute变量的存储位置，并将变量绑定缓冲区
    var a_attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_attribute < 0) {
        console.log("无法获取到变量的" + attribute + "存储位置");
        return false;
    }
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);

    //开启缓冲区
    gl.enableVertexAttribArray(a_attribute);

    return true;
}

var g_modelMatrix = new Matrix4(),
    g_mvpMatrix = new Matrix4();

function draw(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
    //绘制底色
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //绘制基座
    var baseHeight = 2.0; //基座的高度
    g_modelMatrix.setTranslate(0.0, -12.0, 0.0);

    drawBox(gl, n, 10.0, baseHeight, 10.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);


    var arm1Length = 10.0; //第一节胳膊的长度
    g_modelMatrix.translate(0.0, baseHeight, 0.0);
    g_modelMatrix.rotate(g_arm1Angle, 0.0, 1.0, 0.0); //围绕y轴旋转

    drawBox(gl, n, 3.0, arm1Length, 3.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);

    var arm2Length = 10.0; //第二节胳膊的长度
    g_modelMatrix.translate(0.0, arm2Length, 0.0);
    g_modelMatrix.rotate(g_joint1Angle, 0.0, 1.0, 0.0); //围绕z轴旋转
    drawBox(gl, n, 4.0, arm1Length, 4.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);

    var palmLength = 2.0;
    g_modelMatrix.translate(0.0, palmLength, 0.0);
    g_modelMatrix.rotate(g_joint2Angle, 0.0, 0.0, 1.0); //围绕z轴旋转

    drawBox(gl, n, 2.0, palmLength, 2.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
    return;
    g_modelMatrix.translate(0.0, arm1Length, 0.0);
    g_modelMatrix.rotate(g_joint1Angle, 0.0, 0.0, 1.0); //围绕z轴旋转

    drawBox(gl, n, 4.0, arm1Length, 4.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);

    g_modelMatrix.translate(0.0, arm1Length, 0.0);
    g_modelMatrix.rotate(g_joint1Angle, 0.0, 0.0, 1.0); //围绕z轴旋转

    drawBox(gl, n, 4.0, arm1Length, 4.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
}
var g_matrixStack = []; //存储矩阵的值

function pushMatrix(m) {
    var m2 = new Matrix4(m);
    g_matrixStack.push(m2);
}

function popMatrix() {
    return g_matrixStack.pop();
}
var g_normalMatrix = new Matrix4();

function drawBox(gl, n, width, height, depth, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {

    pushMatrix(g_modelMatrix);

    g_modelMatrix.scale(width, height, depth);

    g_mvpMatrix.set(viewProjMatrix);
    g_mvpMatrix.multiply(g_modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, g_mvpMatrix.elements);

    //获取模型矩阵的逆转置矩阵，并赋值u_NormalMatrix
    g_normalMatrix.setInverseOf(g_modelMatrix);
    g_normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);

    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

    g_modelMatrix = popMatrix();

}