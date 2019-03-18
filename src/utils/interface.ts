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
  extname: string;
  imgUrl: string;
  width?: number;
  height?: number;
  type: string;
  id: string;
  sha: string
}

export type ImgZipType = {
  f: string,
  w?: number,
  h?: number,
  id: string,
  s?: string
}
