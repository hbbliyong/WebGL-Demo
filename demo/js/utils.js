class Utils {
    constructor(gl) {
            this.gl = gl;
        }
        /**
         * 生成程序
         * @param {顶点着色器} v_shader 
         * @param {片元着色器} f_shader 
         */
    create_program(v_shader, f_shader) {
        //程序对象的生成
        var program = this.gl.createProgram();
        //向程序对象里分配着色器
        this.gl.attachShader(program, v_shader);
        this.gl.attachShader(program, f_shader);

        //将着色器连接
        this.gl.linkProgram(program);

        //判断着色器的连接是否成功
        if (this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            // 成功的话，将程序对象设置为有效
            this.gl.useProgram(program);
            // 返回程序对象
            return program;
        } else {
            alert(this.gl.getProgramInfoLog(program));
        }
    }

    /**
     * 生成着色器
     * @param {Id} id 
     */
    create_shader(id) {
        //用来保存着色器的变量
        var shader;
        //根据id从HTML中获取指定的script标签
        var scriptElement = document.getElementById(id);
        if (!scriptElement) {
            return;
        }

        //判断script标签的type属性
        switch (scriptElement.type) {
            //顶点着色器
            case 'x-shader/x-vertex':
                shader = this.gl.createShader(this.gl.VERTEX_SHADER);
                break;

                // 片段着色器的时候
            case 'x-shader/x-fragment':
                shader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
                break;
            default:
                return;
        }
        //将标签中的代码分配给生成的着色器
        this.gl.shaderSource(shader, scriptElement.text);
        //编译着色器
        this.gl.compileShader(shader);

        //判断着色器是否编译成功
        if (this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            return shader;
        } else {
            alert(this.gl.getShaderInfoLog(shader));
        }
    }

    /**
     * 生成vbo
     * @param {data} data 
     */
    create_vbo(data) {
        var vbo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo);
        // 向缓存中写入数据；gl.STATIC_DRAW这个常量，定义了这个缓存中内容的更新频率
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(data), this.gl.STATIC_DRAW);
        // 将绑定的缓存设为无效；这是为了防止WebGL中的缓存一致保留，而出现和预想不一致的情况
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

        return vbo;
    }
}