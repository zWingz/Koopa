export interface RestConfig {
  repo: string,
  branch?: string,
  token: string,
}


export interface Config extends RestConfig {
  customUrl?: string
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
