import { Rest } from './rest'
import { getNow, zip } from './helper'
import { Config, ImgType, ImgZipType } from './interface'
import join from 'url-join'
import { Base64 } from 'js-base64'

export type DirType = {
  [k: string]: string
}

export type DataJsonType = {
  data: ImgZipType[]
  dir: DirType
  sha?: string
}

type UploadImageType = {
  filename: string
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
        sha: '',
        dir: {}
      }
      return this.path[path]
    }
  }
}

const cache = new Cache()
const defaultDataJson: DataJsonType = {
  sha: '',
  data: [],
  dir: {}
}

export class Octo {
  owner: string = ''
  repo: string = ''
  branch: string = ''
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
    // this.token = token
    this.customUrl = customUrl
  }
  private getRootPath(): Promise<{ path: string; sha: string }[]> {
    return this.octokit.getTree(this.branch)
  }
  async getRootDataJson(): Promise<DataJsonType> {
    const root = await this.getRootPath()
    const dataJson = root.filter(each => each.path === 'data.json')[0]
    if (dataJson) {
      return this.getPathDataJson('', dataJson.sha)
    }
    return defaultDataJson
  }
  async getPathDataJson(path: string, sha?: string): Promise<DataJsonType> {
    const c = cache.get(path)
    if (c) {
      return c
    }
    let { content } = await this.octokit.getBlob(sha)
    // const buf = Buffer.from(content.data.content, content.data.encoding)
    const buf = Base64.decode(content)
    const json: { data: ImgZipType[]; dir: DirType } = JSON.parse(buf)
    const ret: DataJsonType = {
      ...defaultDataJson,
      data: json.data,
      dir: json.dir,
      sha: sha
    }
    cache.createPath(path, ret)
    return ret
  }

  private async updateDataJson(path, { data, sha, dir }: DataJsonType) {
    const r = await this.octokit.updateFile({
      path: join(path, 'data.json'),
      sha,
      message: `Updated dataJson by PicGo at ${getNow()}`,
      content: Base64.encode(
        JSON.stringify({
          data,
          dir
        })
      )
      // content: Buffer.from(JSON.stringify(data)).toString('base64')
    })
    cache.updateSha(path, r.sha)
    return r
  }
  private async createDataJson(path, { data, dir }: DataJsonType) {
    const r = await this.octokit.createFile({
      path: join(path, 'data.json'),
      message: `Created dataJson by PicGo at ${getNow()}`,
      content: Base64.encode(JSON.stringify({ data, dir }))
      // content: Buffer.from(JSON.stringify(data)).toString('base64')
    })
    cache.updateSha(path, r.sha)
    return r
  }
  updateOrCreateDataJson(path) {
    const dataJson = cache.getOrCreate(path)
    if (dataJson.sha) {
      return this.updateDataJson(path, dataJson)
    } else {
      return this.createDataJson(path, dataJson)
    }
  }
  async uploadImage(path: string, img: UploadImageType) {
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
