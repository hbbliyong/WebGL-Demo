### 1.WebGL着色器和着色器程序对象
编译GLSL ES代码，创建和初始化着色器供WebGL使用。具体分为以下7个步骤：

（1）创建着色器对象（gl.createShader()）

（2）向着色器对象中填充着色器程序的源代码（gl.shaderSource()）

（3）编译着色器（gl.compileShader()）

（4）创建程序对象（gl.createProgram()）

（5）为程序对象分配着色器（gl.attachShader()）

（6）链接程序对象（gl.linkProgram()）

（7）使用程序对象（gl.useProgram()）

在这里出现了两种对象：着色器对象（shader object）和程序对象（program object）。

着色器对象：着色器对象管理一个顶点着色器或一个片元着色器。每一个着色器都有一个着色器对象。

程序对象：程序对象是管理着色器对象的容器。WebGL中，一个程序对象必须包含一个顶点着色器和一个片元着色器。

#### 为程序对象分配着色器对象（gl.attachShader()）

WebGL系统要运行起来，必须要有两个着色器：一个顶点着色器和一个片元着色器。可以使用gl.attachShader()函数为程序对象分配这两个着色器。

#### 连接程序对象（gl.linkProgram()）

在为程序对象分配了两个着色器对象后，还需要将顶点着色器和片元着色器连接起来。使用gl.linkProgram()函数来进行这一步操作。

程序对象进行着色器连接操作，目的是保证：

（1）顶点着色器和片元着色器的varying变量同名同类型，且一一对应

（2）顶点着色器对每个varying变量赋了值

（3）顶点着色器和片元着色器中的同名uniform变量也是同类型的（无需一一对应，即某些uniform变量可以出现在一个着色器中而不出现在另一个中）

（4）着色器中的attribute变量、uniform变量和varying变量的个数没有超过着色器的上线，等等。



在着色器连接之后，应当检查是否连接成功。通过调用gl.getProgramPara-meters()函数来实现。（程序对象即使连接成功了，也有可能运行失败，比如没有为取样器分配纹理单元。这写错误是在运行阶段而不是连接阶段产生的。在运行阶段进行错误检查的性能开销很大，所以通常只在调试程序时这样做。）

如果程序已经成功连接，我们就得到了一个二进制的可执行模块供WebGL系统使用。如果连接失败了，也可以通过调用gl.getProgramInfoLog()从信息日志中获取连接出错信息。


#### 告知WebGL系统所使用的程序对象（gl.useProgram()）

最后，通过调用gl.useProgramUI告知WebGL系统绘制时使用哪个程序对象。


### 9.设置各个点的尺寸
#### 9.1 顶点与尺寸分开 
绘制三个点，三个点的大小不一样
1.创建顶点缓冲区
2.创建顶点尺寸缓冲区
[方式1](09.html)

>创建多个缓冲区，向着色器传值；这只适合数据量少的情况
#### 9.2 顶点尺寸放在一起
```
var verticesSizes = new Float32Array([
    0.0,0.5,10.0,

    -0.5, -0.5,20.0,

    0.5,-0.5,30.0
]);
```
前面两个数据是点的位置信息，第三个数是尺寸信息
gl.vertexAttribPointer(position,2,gl.FLOAT,false,FSIZE*3,0);
gl.vertexAttribPointer(pointSize,1,gl.FLOAT,false,FSIZE*3,FSIZE*2);
FSIZE*3 是一个数据组的大小，而一个数据包含了点位置和尺寸

所以用 第六参数和第二参数去设置；FSIZE是得到数组中每个元素的大小（字节数）
如：var FSIZE = verticesSizes.BYTES_PER_ELEMENT;//得到数组中每个元素的大小（字节数）
 

解读上面意思：一个数据节的大小是FSIZE*3（它里面包含了位置和尺寸），从O开始读两个数据（也就是0.0 和0.5），
传入到a_Position 缓冲区中，a_Position 缓冲区绑定到着色器里的a_Position;然后着色器才去一一执行； 如果还不明白，那我就简单比喻，就好比一个流水线一样，
现在我用盒子把点和尺寸装起来，现在流水线上就是一个一个的盒子，告诉机器，一个盒子是一个点的信息，盒子里面的前两个是位置信息，
后面一个是尺寸；这样就很好的区分，也把一个数据包装在一起；
![1](/resources/imgs/vertexAttribPointer.png)
![2](resources/imgs/vaps.png)
[方式2](09.1.html)

### 10.设置各个点的颜色
方式与9类似
```
   //创建缓冲区
            var vertices = new Float32Array([
                0.0,   0.5,  1.0,0.0,0.0,
				-0.5, -0.5,  0.0,1.0,0.0,
				 0.5, -0.5,  0.0,0.0,1.0
            ]);
```
前两个为顶点坐标，后三个为颜色
```
     var vertexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
            gl.vertexAttribPointer(position, 2, gl.FLOAT, false, FSIZE*5, 0);
            gl.enableVertexAttribArray(position);

            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
            gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, FSIZE*5, FSIZE*2);
            gl.enableVertexAttribArray(aColor);

            gl.drawArrays(gl.POINTS, 0, n);  
```
主要是顶点着色器与片元着色器设置
```
    <script id="vs" type="x-shader/x-vertex">
        attribute vec4 position; 
		attribute vec4 a_Color; 
		varying   vec4 v_Color;
		void main(void){ 
			v_Color=a_Color; 
			gl_Position=position; 
			gl_PointSize=10.0;
			}
    </script>

    <script id="fs" type="x-shader/x-fragment">
		precision mediump float;
		varying vec4 v_Color;
        void main(void){ gl_FragColor =v_Color; }
    </script>
```
这里注意设置：gl_PointSize=10.0;顶点大小，不然看不到效果

### 11.WebGL使用纹理贴图
[案例](https://blog.csdn.net/qq_30100043/article/details/72771864)

#### 11.1 WebGL使用多幅纹理
案例 11.2.html
然后在main()里面使用两个变量color和color1获取颜色，使用分量乘法——两个矢量中对应的分量相乘作为新矢量的分量，来获取最终的片元颜色并赋值给了gl_FragColor。
![vec4矢量相乘](resources/imgs/20170527142725349.png)