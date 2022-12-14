// 为了有语法提示
// 提交前需要删除这段
// const cheerio = require('cheerio')

function scheduleHtmlParser(html) {
  //可使用解析dom匹配，工具内置了$，跟jquery使用方法一样，直接用就可以了，参考：https://juejin.im/post/5ea131f76fb9a03c8122d6b9
  let result = []
  let $ = cheerio.load(html, {
    decodeEntities: false
  })
  console.log("------------------------------------------------------------------------------------------")
  let config = {}
  try {
    config = JSON.parse($('#ngubin').text())
  } catch (error) { }
  console.log("------------------------------------------------------------------------------------------")
  try {
    $('tbody').children().each(function (i, el) {
      if (i) { //除去第一行
        const num = [] //那一节课到哪一节课
        let brk = false
        $(el).children().each(function (i1, el1) { //tr
          if (brk) return
          if (i1 == 0) { //th
            let inner = el1.childNodes[0]
            if (inner.data.includes('备注')) {
              brk = true
              return
            }
            brk = false
            num.push(...Array.from(inner.data.trim().matchAll(/\d+/g)).map(e => +e))
          } else { //td
            $(this).children().each((i2, el2) => { //格子
              const none = new RegExp(/display\s?:\s?none/)
              if (el2.name == 'div' && !(el2.attribs && (el2.attribs.type == 'hidden' || none.test(el2.attribs.style)))) { //显示的格子
                let cls = {
                  name: ''
                }
                el2.childNodes.forEach((node, index) => { //格子里每一行
                  if (node.type == 'text') {
                    if (!node.data.trim()) return
                    if (/^\-+$/.test(node.data.trim())) {//分割线
                      result.push(cls)
                      cls = { name: '' }
                      return
                    }
                    cls.name += node.data.trim()
                    cls.day = i1
                    cls.sections = num.map(sec => ({
                      section: sec
                    }))
                  } else {
                    if (node.attribs && none.test(node.attribs.style)) return
                    if (node.name == 'font') {
                      if (node.attribs && node.attribs.title && node.attribs.title.includes('老师')) {
                        cls.teacher = $(node).text().replace(config.delTitle ? /其他|老师|\(.+\)|（.+）/g : '', '').trim()
                        // console.log(cls.teacher) //老师名称
                      } else if (node.attribs && node.attribs.title && node.attribs.title.includes('周次')) {
                        let str = /(\d+[\s\-]*\d+|\d+).*周/.exec($(node).text().trim())  //匹配周次
                        console.log(str[0],"=======",str)
                        if (str[1].includes('-')) {
                          let arr = str[1].split('-'),
                            arr1 = Array(arr[1] - arr[0] + 1).fill().map((v, i) => +i + +arr[0].trim())
                          console.log(arr1,"=======++++++++++++")
                            cls.weeks = arr1
                        } else {
                          cls.weeks = str[1].split(',').map(v => +v.trim())
                        }
                      } else if (node.attribs && node.attribs.title && node.attribs.title.includes('教室')) {
                        cls.position = $(node).text().trim()
                      }
                    }
                  }
                })
                if (cls.name) {
                  result.push(cls)
                }
                console.info(cls)
              }
            })
          }
        })
      }
    })
    console.info(result)
    return result
  } catch (error) {
    console.error(error);
  }
}