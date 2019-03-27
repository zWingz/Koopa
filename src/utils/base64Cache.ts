import { Octo } from './octokit'
const cache = {}
const MAX_LENGTH = 100
const MID = MAX_LENGTH / 2
let index = 0

function checkMax() {
  if (index >= MAX_LENGTH) {
    index = MID
    const keys = Object.keys(cache)
    for(let i = 0; i < index; i ++) {
      delete cache[keys[i]]
    }
  }
}

export function getBase64ForImage(ins: Octo, sha) {
  if (sha in cache) {
    return Promise.resolve(cache[sha])
  }
  checkMax()
  return ins.api.getBlob(sha).then(({ content }) => {
    cache[sha] = content
    index++
    return content
  })
}
