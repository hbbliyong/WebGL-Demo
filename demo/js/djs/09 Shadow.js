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