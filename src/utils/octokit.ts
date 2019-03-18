import { Rest } from './rest'
import { getNow } from './helper'
import { Config, ImgType } from './interface'
import join from 'url-join'
import { Base64 } from 'js-base64'
export class Octo {
  owner: string = ''
  repo: string = ''
  branch: string = ''
  path: string = ''
  token: string = ''
  customUrl: string = ''
  octokit: Rest
  constructor({ repo, branch, token, customUrl = '' }: Config) {
    const [owner, r] = repo.split('/')
    if (!r) throw new Error('Error in repo name')
    this.octokit = new Rest({
      token,
      repo,
      branch,
    })
    this.owner = owner
    this.repo = r
    this.branch = branch || 'master'
    this.token = token
    this.customUrl = customUrl
  }

  getTree(sha) {
    return this.octokit.getTree(sha)
  }
  async getPathTree(path): Promise<{ sha: string; tree: any[] }> {
    let tree = await this.getTree(this.branch)
    const arr = path.split('/').filter(each => each)
    let sha = this.branch
    for (let i = 0; i < arr.length; i++) {
      const item = tree.filter(each => arr[i].endsWith(each.path))[0]
      if (!item) return Promise.reject(new Error(`Can\'t find ${path}`))
      sha = item.sha
      tree = await this.getTree(sha)
    }
    return { sha, tree }
  }
  async getDataJson(path: string): Promise<{
    lastSync: string
    data: any[]
    sha?: string
  }> {
    const defaultRet = {
      lastSync: '',
      data: []
    }
    const { tree } = await this.getPathTree(path)
    const dataJson = tree.filter(each => each.path === 'data.json')[0]
    if (dataJson) {
      let { content } = await this.octokit.getBlob(dataJson.sha)
      // const buf = Buffer.from(content.data.content, content.data.encoding)
      const buf = Base64.decode(content)
      const json = JSON.parse(buf)
      return {
        ...defaultRet,
        ...json,
        sha: dataJson.sha
      }
    }
    return defaultRet
  }
  updateDataJson({ data, sha }) {
    const { path } = this
    return this.octokit.updateFile({
      path: join(path, 'data.json'),
      sha,
      message: `Sync dataJson by PicGo at ${getNow()}`,
      content: Base64.decode(JSON.stringify(data))
      // content: Buffer.from(JSON.stringify(data)).toString('base64')
    })
  }
  createDataJson(data) {
    const { path } = this
    return this.octokit.createFile({
      path: join(path, 'data.json'),
      message: `Sync dataJson by PicGo at ${getNow()}`,
      content: Base64.decode(JSON.stringify(data))
      // content: Buffer.from(JSON.stringify(data)).toString('base64')
    })
  }
  async upload(img) {
    const { path = '' } = this
    const { fileName } = img
    const d = await this.octokit.createFile({
      path: join(path, fileName),
      message: `Upload ${fileName} by picGo - ${getNow()}`,
      content: img.base64Image
    })
    if (d) {
      return {
        imgUrl: this.parseUrl(fileName),
        sha: d.data.content.sha
      }
    }
    throw d
  }
  removeFile(img: ImgType) {
    const { path } = this
    return this.octokit.deleteFile({
      path: join(path, img.fileName),
      message: `Deleted ${img.fileName} by PicGo - ${getNow()}`,
      sha: img.sha
    })
  }
  parseUrl(fileName) {
    const { owner, repo, path, customUrl, branch } = this
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
