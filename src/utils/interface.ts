export interface RestConfig {
  repo: string,
  branch?: string,
  token: string,
}


export interface Config extends RestConfig {
  customUrl?: string
  isPrivate?: boolean
}

export type ImgType = {
  fileName: string;
  imgUrl: string;
  sha: string
}

export type ImgZipType = {
  f: string,
  s?: string
}
