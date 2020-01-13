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