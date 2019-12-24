const canvasApi = require("../../utils/canvas.js");

Page({
  data: {
  },
  onReady() { 
    let ctx = wx.createCanvasContext('share')
    wx.request({
      url: 'http://localhost:3005/get',
      method: 'GET', 
      success: function(res) {        
        if (res && res.data) {  
          canvasApi.drawJsonDataToCancasContext(ctx, res.data)        
        }
      },
    })
  },
})
