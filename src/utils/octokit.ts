import { Rest } from './rest'
import { getNow, zip } from './helper'
import { Config, ImgType, ImgZipType } from './interface'
import join from 'url-join'
import { Base64 } from 'js-base64'

export function clone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

export type DirType = {
  [k: string]: string
}

export type DataJsonType = {
  images: ImgType[]
  dir: DirType
}

type UploadImageType = {
  filename: string
  base64: string
}

const DEFAULT_DATA_JSON: DataJsonType = {
  dir: {},
  images: []
}

class Cache {
  path: {
    [k: string]: DataJsonType
  } = {}
  create(path: string, data: DataJsonType) {
    this.path[path] = data
  }
  addImg(path: string, img: ImgType) {
    this.path[path].images.push(img)
  }
  get(path: string) {
    const ret = this.path[path]
    return ret
  }
}
export const cache = new Cache()

const ImageRegExg = /\.(jpg|jpeg|png)$/

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
    this.customUrl = customUrl
  }
  getRootPath(): Promise<{ path: string; sha: string }[]> {
    return this.octokit.getTree(this.branch)
  }
  async getTree(
    pathName: string = '',
    pathSha: string = this.branch
  ): Promise<DataJsonType> {
    const c = cache.get(pathName)
    if (c) {
      return c
    }
    let ret = {
      dir: {},
      images: []
    }
    if (pathSha) {
      const data = await this.octokit.getTree(pathSha)
      const dir = {}
      const images = []
      data.forEach(each => {
        const { path, type, sha } = each
        if (type === 'tree') {
          dir[path] = sha
        } else if (ImageRegExg.test(path)) {
          images.push({
            name: path,
            sha
          })
        }
      })
      ret = {
        dir,
        images
      }
    }
    cache.create(pathName, ret)
    return ret
  }

  createPath(absolute: string, pathName: string) {
    const parent = cache.get(absolute)
    parent.dir[pathName] = ''
    cache.create(join(absolute, pathName), clone(DEFAULT_DATA_JSON))
  }

  async uploadImage(path: string, img: UploadImageType) {
    const { filename } = img
    const d = await this.octokit.createFile({
      path: join(path, filename),
      message: `Upload ${filename} by picGo - ${getNow()}`,
      content: img.base64
    })
    if (d) {
      const dataJson = cache.get(path)
      dataJson.images.push({
        name: filename,
        sha: d.sha
      })
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
      path: join(path, img.name),
      message: `Deleted ${img.name} by PicGo - ${getNow()}`,
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
