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
  /**
   * 封装github api
   *
   * @param {{
   *     url?: string
   *     data?: any
   *     method?: Methdos
   *   }} [{
   *     url = '',
   *     data = {},
   *     method = 'GET'
   *   }={}]
   * @returns
   * @memberof Rest
   */
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
    }).then(res => {
      const { statusCode, data } = res
      if (statusCode === 401) {
        throw new Error('Token验证出错了!')
      } else if (statusCode !== 200) {
        throw new Error(data.message)
      }
      return data
    })
  }
  /**
   * 获取用户信息接口
   *
   * @returns
   * @memberof Rest
   */
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
  /**
   * 获取tree接口
   *
   * @param {string} sha
   * @returns {Promise<{ path: string; sha: string; type: string }[]>}
   * @memberof Rest
   */
  getTree(sha: string): Promise<{ path: string; sha: string; type: string }[]> {
    const url = `/repos/${this.repo}/git/trees/${sha}`
    return this.request({ url }).then(d => d.tree)
  }
  /**
   * 获取文件blob接口
   *
   * @param {string} sha
   * @returns {Promise<{
   *     content: string
   *     encoding: string
   *     sha: string
   *     size: number
   *   }>}
   * @memberof Rest
   */
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
  /**
   * 创建文件接口
   *
   * @param {{
   *     path: string
   *     content: string
   *     message: string
   *   }} {
   *     path,
   *     content,
   *     message
   *   }
   * @returns {Promise<FileResponseType>}
   * @memberof Rest
   */
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

  /**
   * 删除文件接口
   *
   * @param {{
   *     path: string
   *     message: string
   *     sha: string
   *   }} {
   *     path,
   *     message,
   *     sha
   *   }
   * @returns
   * @memberof Rest
   */
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
