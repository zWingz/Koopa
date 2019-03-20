import { Rest } from './rest'
import { getNow, zip } from './helper'
import { Config, ImgType, ImgZipType } from './interface'
import join from 'url-join'
import { Base64 } from 'js-base64'

type DataJsonType = {
  data: ImgZipType[]
  sha: string
}

type UploadImageType = {
  filename: string,
  base64: string
}

class Cache {
  path: {
    [k: string]: DataJsonType
  } = {}
  createPath(path: string, data: DataJsonType) {
    this.path[path] = data
  }
  addImg(path: string, img: ImgZipType) {
    this.path[path].data.push(img)
  }
  updateSha(path: string, sha: string) {
    this.path[path].sha = sha
  }
  get(path: string) {
    return this.path[path]
  }
  getOrCreate(path: string) {
    const tmp = this.path[path]
    if (tmp) {
      return tmp
    } else {
      this.path[path] = {
        data: [],
        sha: ''
      }
      return this.path[path]
    }
  }
}

const cache = new Cache()

export class Octo {
  owner: string = ''
  repo: string = ''
  branch: string = ''
  token: string = ''
  customUrl: string = ''
  octokit: Rest
  constructor({ repo, branch, token, customUrl = '' }: Config) {
    const [owner, r] = repo.split('/')
    if (!r) throw new Error('Error in repo name')
    this.octokit = new Rest({
      token,
      repo,
      branch
    })
    this.owner = owner
    this.repo = r
    this.branch = branch || 'master'
    this.token = token
    this.customUrl = customUrl
  }

  async getPathTree(
    path
  ): Promise<{ sha: string; tree: { path: string; sha: string }[] }> {
    let tree = await this.octokit.getTree(this.branch)
    const arr = path.split('/').filter(each => each)
    let sha = this.branch
    for (let i = 0; i < arr.length; i++) {
      const item = tree.filter(each => arr[i].endsWith(each.path))[0]
      if (!item) return Promise.reject(new Error(`Can\'t find ${path}`))
      sha = item.sha
      tree = await this.octokit.getTree(sha)
    }
    return { sha, tree }
  }
  async getDataJson(path: string): Promise<DataJsonType> {
    const c = cache.get(path)
    if (c) {
      return c
    }
    const defaultRet: DataJsonType = {
      sha: '',
      data: []
    }
    const { tree } = await this.getPathTree(path)
    const treeItem = tree.filter(each => each.path === 'data.json')[0]
    if (treeItem) {
      let { content } = await this.octokit.getBlob(treeItem.sha)
      // const buf = Buffer.from(content.data.content, content.data.encoding)
      const buf = Base64.decode(content)
      const json: ImgZipType[] = JSON.parse(buf)
      console.log(json);
      const ret: DataJsonType = {
        ...defaultRet,
        data: json,
        sha: treeItem.sha
      }
      console.log(ret);
      cache.createPath(path, ret)
      return ret
    }
    console.log('cant find')
    return defaultRet
  }
  async updateDataJson(path, { data, sha }) {
    const r = await this.octokit.updateFile({
      path: join(path, 'data.json'),
      sha,
      message: `Updated dataJson by PicGo at ${getNow()}`,
      content: Base64.encode(JSON.stringify(data))
      // content: Buffer.from(JSON.stringify(data)).toString('base64')
    })
    cache.updateSha(path, r.sha)
    return r
  }
  async createDataJson(path, data) {
    const r = await this.octokit.createFile({
      path: join(path, 'data.json'),
      message: `Created dataJson by PicGo at ${getNow()}`,
      content: Base64.encode(JSON.stringify(data))
      // content: Buffer.from(JSON.stringify(data)).toString('base64')
    })
    cache.updateSha(path, r.sha)
    return r
  }
  updateOrCreateDataJson(path) {
    const dataJson = cache.getOrCreate(path)
    if(dataJson.sha) {
      return this.updateDataJson(path, dataJson)
    } else {
      return this.createDataJson(path, dataJson.data)
    }
  }
  async upload(path: string, img: UploadImageType) {
    const { filename } = img
    const d = await this.octokit.createFile({
      path: join(path, filename),
      message: `Upload ${filename} by picGo - ${getNow()}`,
      content: img.base64
    })
    if (d) {
      const dataJson = cache.getOrCreate(path)
      dataJson.data.push({
        f: filename,
        s: d.sha
      })
      console.log(cache)
      return {
        imgUrl: this.parseUrl(path, filename),
        sha: d.sha,
        filename
      }
    }
    throw d
  }
  removeFile(path, img: ImgType) {
    return this.octokit.deleteFile({
      path: join(path, img.fileName),
      message: `Deleted ${img.fileName} by PicGo - ${getNow()}`,
      sha: img.sha
    })
  }
  getUser() {
    return this.octokit.getUser()
  }
  parseUrl(path, fileName) {
    const { owner, repo, customUrl, branch } = this
    if (customUrl) {
      return join(customUrl, path, fileName)
    }
    return join(
      `https://raw.githubusercontent.com/`,
      owner,
      repo,
      branch,
      path,
      fileName
    )
  }
}

let ins: Octo

export function getIns(config: Config): Octo {
  if (ins) return ins
  ins = new Octo(config)
  return ins
}

/* istanbul ignore next */
export function clearIns() {
  // just for test
  ins = null
}
