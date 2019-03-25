import Taro from '@tarojs/taro'
import join from 'url-join'
import { RestConfig } from './interface'

type Methdos = 'GET' | 'POST' | 'PUT' | 'DELETE'
type FileResponseType = {
  name: string
  sha: string
  path: string
}

class Rest {
  repo = ''
  path = ''
  branch = 'master'
  url = 'https://api.github.com'
  headers = {
    Authorization: ''
  }
  constructor({ repo, token, branch }: RestConfig) {
    this.repo = repo
    this.headers = {
      Authorization: `token ${token}`
    }
    this.branch = branch
  }
  request({
    url = '',
    data = {},
    method = 'GET'
  }: {
    url?: string
    data?: any
    method?: Methdos
  } = {}) {
    return Taro.request({
      url: join(this.url, url),
      header: this.headers,
      method,
      data
    }).then(({ data }) => {
      return data
    })
  }
  test() {
    return this.request()
  }
  getUser() {
    const url = 'user'
    return this.request({ url }).then(d => {
      const { login: username, avatar_url: avatar } = d
      return {
        username,
        avatar
      }
    })
  }
  getTree(sha: string): Promise<{ path: string; sha: string, type: string }[]> {
    const url = `/repos/${this.repo}/git/trees/${sha}`
    return this.request({ url }).then(d => d.tree)
  }
  getBlob(
    sha: string
  ): Promise<{
    content: string
    encoding: string
    sha: string
    size: number
  }> {
    const url = `/repos/${this.repo}/git/blobs/${sha}`
    return this.request({ url })
  }
  createFile({
    path,
    content,
    message
  }: {
    path: string
    content: string
    message: string
  }): Promise<FileResponseType> {
    const url = `/repos/${this.repo}/contents/${path}`
    return this.request({
      url,
      method: 'PUT',
      data: {
        content,
        message
      }
    }).then(r => {
      const {
        content: { name, path, sha }
      } = r
      return {
        name,
        path,
        sha
      }
    })
  }
  // updateFile({
  //   path,
  //   content,
  //   message,
  //   sha
  // }: {
  //   path: string
  //   content: string
  //   message: string
  //   sha: string
  // }): Promise<FileResponseType> {
  //   const url = `/repos/${this.repo}/contents/${path}`
  //   return this.request({
  //     url,
  //     method: 'PUT',
  //     data: {
  //       content,
  //       message,
  //       sha
  //     }
  //   }).then(r => {
  //     const {
  //       content: { name, path, sha }
  //     } = r
  //     return {
  //       name,
  //       path,
  //       sha
  //     }
  //   })
  // }
  deleteFile({
    path,
    message,
    sha
  }: {
    path: string
    message: string
    sha: string
  }) {
    const url = `/repos/${this.repo}/contents/${path}`
    return this.request({
      url,
      method: 'DELETE',
      data: {
        message,
        sha
      }
    })
  }
}

export { Rest }
