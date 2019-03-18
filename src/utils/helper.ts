import dayjs from 'dayjs'
import { ImgType, ImgZipType } from './interface'
export function getNow () {
  return dayjs().format('YYYY-MM-DD hh:mm:ss')
}

export function zip (img: ImgType): ImgZipType {
  return {
    f: img.fileName,
    s: img.sha
  }
}

export function unzip (
  img: ImgZipType
): ImgType {
  const { f: fileName, s } = img
  return {
    fileName,
    sha: s,
    imgUrl: '',
  }
}
