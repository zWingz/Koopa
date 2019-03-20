export function readFile(filePath): Promise<string> {
  return new Promise((res, rej) => {
    wx.getFileSystemManager().readFile({
      filePath,
      encoding: 'base64',
      success: ({ data }) => {
        res(data)
      },
      fail: e => {
        rej(e)
      }
    })
  })
}
