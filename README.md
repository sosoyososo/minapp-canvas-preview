小程序画布生成内容预览

## 预览
直接运行minapp-canvasdata-server服务端，编辑好数据之后，在这里刷新即可预览

## 绘制
先引入 utils/canvas.js 文件到自己的小程序

```
//wxml文件
<canvas canvas-id="share" />

//JS文件
const canvasApi = require("../../utils/canvas.js");
let ctx = wx.createCanvasContext('share')
let jsonData = #{生成的json数据}
canvasApi.drawJsonDataToCancasContext(ctx, res.data)
```