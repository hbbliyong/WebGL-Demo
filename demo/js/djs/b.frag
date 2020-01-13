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
        gl_FragColor=vec4(lightWeighting.r*texelColor.rgb,texelColor.a);
    }