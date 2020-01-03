export function drawDataFromUrl (ctx, url) {
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: 'GET',
      success: function (res) {
        if (res && res.data) {
          drawJsonDataToCancasContext(ctx, res.data).then(resolve)
        }
      },
      fail: reject,
    })
  })
}

export function drawJsonDataToCancasContext (ctx, jsonList) {
  if (!jsonList || !ctx) return

  let promises = []
  jsonList.forEach(json => {
    Object.keys(json).forEach(key => {
      let v = json[key];
      if (!v) return
      switch (key) {
        case "image": {
          if (v.url) {
            promises.push(getImageInfo(v.url).then(res => {              
              return {image: {path: res.path, ...v}}
            }))
          }
          break
        }
        default: {
          promises.push(new Promise(resolve => {
            let data = {}
            data[key] = v
            resolve(data)
          }))
        }
      }
    })
  })

  return Promise.all(promises).then((jsonList) => {
    jsonList.forEach(json => {      
      Object.keys(json).forEach(key => {
        let v = json[key];
        if (!v) return      
        switch (key) {
          case "line": {          
            drawLine(ctx, v.x, v.y, v.w, v.h, v)
            break
          }
          case "rect": {
            roundPath(ctx, v.x, v.y, v.w, v.h, v.r, v, ()=>{
              attatchJsonAttrToContext(ctx, v)
              ctx.clip()
              ctx.fill()
              ctx.stroke()
            })
            break
          }
          case "text": {
            drawText(ctx, v.text, v.x, v.y, v)
            break
          }
          case "image": {
            drawImage(ctx, v.path, v.x, v.y, v.w, v.h, v)
          }
        }
      })
    })    
  }).then(() => {
    ctx.draw()
  })
}

/*******************************************************************************************/
export function drawImage (ctx, path, x, y, w, h, option) {
  if (!path) return

  if (!option.r) {
    ctx.save()
    attatchJsonAttrToContext(ctx, option)
    ctx.drawImage(path, rpx2px(x), rpx2px(y), rpx2px(w), rpx2px(h))
    ctx.restore()
    return
  }

  roundPath(ctx, x,y,w,h, option.r, {topLeft:true, topRight:true, bottomLeft:true, bottomRight:true}, () => {
    attatchJsonAttrToContext(ctx, option)
    ctx.clip()
    ctx.drawImage(path, rpx2px(x), rpx2px(y), rpx2px(w), rpx2px(h))
    ctx.stroke()
  })

}

export function drawText (ctx, text, x, y, options) {
  if (!text) return

  ctx.save()
  attatchJsonAttrToContext(ctx, options)

  let fontSize = 24;
  if (options && options.fontSize) {
    fontSize = options.fontSize;
  }

  let lines = [text]
  if (options && options.wrap) {
    let width = options.maxWidth;
    if (!width) width = 100;
    lines = breakText(ctx, text, width)
  }

  ctx.setFontSize(rpx2px(fontSize))
  for (let i = 0;i < lines.length; i ++) {
    let str = lines[i];
    let lineSpace = 0
    if (options && options.lineSpace) {
      lineSpace = options.lineSpace;
    }
    let top = y + (fontSize + lineSpace) * i;
    ctx.fillText(str, rpx2px(x), rpx2px(top))
    if (options && options.bold) {
      ctx.fillText(str, rpx2px(x-0.5), rpx2px(top))
      ctx.fillText(str, rpx2px(x+0.5), rpx2px(top))
      ctx.fillText(str, rpx2px(x), rpx2px(top+0.5))
      ctx.fillText(str, rpx2px(x), rpx2px(top-0.5))
    }
  }
  ctx.restore()
}

export function drawLine (ctx, x, y, offset_x, offset_y, options) {
  if (offset_x <= 0 && offset_y <= 0) return;
  ctx.save()

  ctx.moveTo(rpx2px(x), rpx2px(y))
  ctx.lineTo(rpx2px(x)+rpx2px(offset_x), rpx2px(y)+rpx2px(offset_y))

  attatchJsonAttrToContext(ctx, options)
  ctx.stroke()

  ctx.restore()
}

export function roundPath (ctx, x, y, w, h, r, options, action) {
  if (w <= 0 || h <= 0) return
  
  ctx.save();

  ctx.beginPath()

  // top left
  if (options && options.topLeft) {
    ctx.moveTo(rpx2px(x), rpx2px(y)-rpx2px(r))
    ctx.arc(rpx2px(x) + rpx2px(r), rpx2px(y) + rpx2px(r), rpx2px(r), Math.PI, Math.PI * 1.5)
  } else {
    ctx.moveTo(rpx2px(x),rpx2px(y))
  }

  // top right
  if (options && options.topRight) {
    ctx.lineTo(rpx2px(x)+rpx2px(w)-rpx2px(r),rpx2px(y))
    ctx.arc(rpx2px(x)+rpx2px(w)-rpx2px(r), rpx2px(y) + rpx2px(r), rpx2px(r), Math.PI * 1.5, Math.PI * 2)
  } else {
    ctx.lineTo(rpx2px(x)+rpx2px(w), rpx2px(y))
  }

  //bottom right
  if (options && options.bottomRight) {
    ctx.lineTo(rpx2px(x)+rpx2px(w),rpx2px(y)+rpx2px(h)-rpx2px(r))
    ctx.arc(rpx2px(x)+rpx2px(w)-rpx2px(r), rpx2px(y) + rpx2px(h) - rpx2px(r), rpx2px(r), Math.PI * 2, Math.PI * 0.5)
  } else {
    ctx.lineTo(rpx2px(x)+rpx2px(w), rpx2px(y)+rpx2px(h))
  }

  //bottom left
  if (options && options.bottomLeft) {
    ctx.lineTo(rpx2px(x)+rpx2px(r),rpx2px(y)+rpx2px(h))
    ctx.arc(rpx2px(x)+rpx2px(r), rpx2px(y) + rpx2px(h) - rpx2px(r), rpx2px(r), Math.PI * 0.5, Math.PI)
  } else {
    ctx.lineTo(rpx2px(x), rpx2px(y)+rpx2px(h))
  }
  ctx.closePath()

  if (action) action()

  ctx.beginPath()
  ctx.closePath()

  ctx.restore()
}

export function getImageInfo (url) {
  return new Promise((resolve, reject) => {
    if (!url || url.length == 0) {
      resolve({path:"", width:0, height:0})
      return
    }
    wx.getImageInfo({
      src: url,
      success: resolve,
      fail: reject,
    })
  })
}

/*******************************************************************************************/
function breakText (ctx, text, maxWidth) {
  let arrText = text.split('');
  let line = '';
  let arrTr = [];
  for (let i = 0; i < arrText.length; i++) {
    let testLine = line + arrText[i];
    let metrics = ctx.measureText(testLine);
    let width = rpx2px(metrics.width);
    if (width > rpx2px(maxWidth) && i > 0) {
      arrTr.push(line);
      line = arrText[i];
    } else {
      line = testLine;
    }
    if (i == arrText.length - 1) {
      arrTr.push(line);
    }
  }
  return arrTr;
}


function rpx2px (rpx) {
  const {
    windowWidth
  } = wx.getSystemInfoSync()
  return windowWidth / 750 * rpx * 2;
}

export function canvasToTempFilePath (option, context) {
  return new Promise((resolve, reject) => {
    wx.canvasToTempFilePath({
      ...option,
      success: resolve,
      fail: reject,
    }, context)
  })
}

export function saveImageToPhotosAlbum (option) {
  return new Promise((resolve, reject) => {
    wx.getSetting({
      success (res) {
        if (!res.authSetting['scope.writePhotosAlbum']) {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success () {
              wx.saveImageToPhotosAlbum({
                ...option,
                success: resolve,
                fail: reject,
              })
            },
            fail () {
              reject("右上角...->设置，打开相册权限，才能保存")
            }
          })
        }else{//用户已经授权过了
          wx.saveImageToPhotosAlbum({
            ...option,
            success: resolve,
            fail: reject,
          })
        }
      }
    })
  })
}

/**********************************************************************/
const keyMapper = {
  "lineWidth":(ctx, lineWidth) => {
    ctx.setLineWidth(rpx2px(lineWidth))
  },
  "bgColor":(ctx, color) => {
    ctx.setFillStyle(color)
  },
  "color": (ctx, color) => {
    ctx.setStrokeStyle(color)
  },
  "fontColor":(ctx, color) => {
    ctx.setFillStyle(color)
  },
  "fontSize":(ctx, size) => {
    ctx.setFontSize(rpx2px(size))
  },
  "borderColor":(ctx, color) => {
    ctx.setStrokeStyle(color)
  },
}

function attatchJsonAttrToContext (ctx, json) {
  if (!json) return

  Object.keys(json).forEach(key => {
    let f = keyMapper[key];
    if (f) {
      console.log(key, json[key], f)
      f(ctx, json[key])
    }
  })
}
