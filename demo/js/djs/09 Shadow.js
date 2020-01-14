//创建阴影贴图的顶点着色器
var SHADOW_VSHADER_SOURCE =
    `
    attribute vec4 aPosition;
    uniform mat4 uMvpMatrix;
    void main(){
        gl_Position=uMvpMatrix*aPosition;
    }
    `;

//创建阴影贴图的片段着色器
var SHADOW_FSHADER_SOURCE =
    `
    #ifdef GL_ES
    precision mediump float;
    #endif

    void main() {
        gl_FragColor = vec4(gl_FragCoord.z,0.0,0.0,0.0);//将深度值（z轴）写入红色分量
    }
    `;

//绘制使用的顶点着色器
var VSHADER_SOURCE = `
attribute vec4 aPosition;
attribute vec4 aColor;
uniform mat4 uMvpMatrix;
uniform mat4 uMvpMatrixFromLight;
varying vec4 vPositionFromLight;
varying vec4 vColor;

void main() {
	gl_Position=uMvpMatrix*aPosition;
    vPositionFromLight=uMvpMatrixFromLight*aPosition;
    vColor=aColor;
}
`;
//绘制使用的片段着色器
var FSHADER_SOURCE = `
#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D uShadowMap;
varying vec4 vPositionFromLight;
varying vec4 vColor;
void main() {
    vec3 shadowCoord=(vPositionFromLight.xyz/vPositionFromLight.w)/2.0+0.5;
    vec4 rgbaDepth=texture2D(uShadowMap,shadowCoord.xy);
    float depth=rgbaDepth.r;//从红色分量重取出深度值
    //判断当前像素是否处于阴影之中
    //float visibility=(shadowCoord.z>depth)?0.7:1.0;//会出现马赫带
    float visibility=(shadowCoord.z>depth+0.005)?0.7:1.0;//// + 0.005 之后不会出现马赫带
    gl_FragColor = vec4(vColor.rgb*visibility,vColor.a);
}
`;


var OFFSCREEN_WIDTH = 2048,
    OFFSCREEN_HEIGHT = 2048;
//光照位置
var LIGHT_X = 0,
    LIGHT_Y = 40,
    LIGHT_Z = 2; //光源拉远之后，阴影就消失了
var LIGHT_X = 0,
    LIGHT_Y = 7,
    LIGHT_Z = 2;

function main() {
    let canvas = document.getElementById('canvas');
    let gl = getWebGLContext(canvas);

    //创建阴影贴图程序对象
    let shadowProgram = createProgram(gl, SHADOW_VSHADER_SOURCE, SHADOW_FSHADER_SOURCE);
    shadowProgram.aPosition = gl.getAttribLocation(shadowProgram, 'aPosition');
    shadowProgram.uMvpMatrix = gl.getUniformLocation(shadowProgram, 'uMvpMatrix');

    //创建正常渲染程序对象
    let normalProgram = createProgram(gl, VSHADER_SOURCE, FSHADER_SOURCE);
    normalProgram.aPosition = gl.getAttribLocation(normalProgram, 'aPosition');
    normalProgram.aColor = gl.getAttribLocation(normalProgram, 'aColor');
    normalProgram.uMvpMatrix = gl.getUniformLocation(normalProgram, 'uMvpMatrix');
    normalProgram.uMvpMatrixFromLight = gl.getUniformLocation(normalProgram, 'uMvpMatrixFromLight');
    normalProgram.uShadowMap = gl.getUniformLocation(normalProgram, 'uShadowMap');

    //获取顶点数据
    let triangle = initVertexBufferForTriangle(gl);
    let plane = initVertexBuffersForPlane(gl);

    //初始化帧缓存对象
    let fbo = initFramebufferObject(gl);

    //设定当前的帧缓存对象为当前对象
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fbo.texture);

    //清屏开始深度测试
    gl.clearColor(0.0, .0, .0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    //用于生成阴影贴图的光线矩阵
    let viewProjMatrixFromLight = new Matrix4();
    //透视投影
    viewProjMatrixFromLight.setPerspective(70.0, OFFSCREEN_WIDTH / OFFSCREEN_HEIGHT, 1.0, 100.0);
    viewProjMatrixFromLight.lookAt(LIGHT_X, LIGHT_Y, LIGHT_Z, .0, .0, .0, .0, 1.0, .0);

    //用于绘制的查看矩阵
    let viewProjMatrix = new Matrix4();
    viewProjMatrix.setPerspective(45, canvas.width / canvas.clientHeight, 1.0, 100.0);
    viewProjMatrix.lookAt(.0, 7.0, 9.0, .0, .0, .0, .0, 1.0, .0);

    //旋转角度
    let currentAngle = .0;
    //三角形的模型视图投影矩阵（model view projection matrix）
    let mvpMatrixFromLight_t = new Matrix4();
    //面板的模型视图投影矩阵
    let mvpMatrixFromLight_p = new Matrix4();
}