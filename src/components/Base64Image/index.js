/* eslint-disable */
const { getIns } = require('../../utils/octokit')
const ConfigStore = require('../../store/config')
const { getBase64ForImage } = require('../../utils/base64Cache')
const step = 1024 * 1022
Component({
  options: {
    addGlobalClass: true
  },
  data: {
    arr: [],
    show: false
  },
  properties: {
    sha: String,
    type: String
  },
  attached() {
    this.getData()
  },
  methods: {
    getData() {
      const ins = getIns(ConfigStore.default)
      let index = 0,
        start = 0,
        end = 0
      getBase64ForImage(ins, this.data.sha).then(content => {
        const tmp =
          `data:image/${this.data.type};base64,` +
          content.replace(/[\r\t\n]/g, '')
        const len = tmp.length
        while ((end = start + step) < len) {
          const key = `arr[${index}]`
          this.setData({
            [key]: tmp.slice(start, end)
          })
          start += step
          index++
        }
        this.setData({
          [`arr[${index}]`]: tmp.slice(start)
        })
        this.triggerEvent('load')
        this.setData({
          show: true
        })
      })
    }
  }
})
