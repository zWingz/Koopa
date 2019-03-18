import { ComponentType } from 'react'
import Taro, { Component, Config, chooseImage } from '@tarojs/taro'
import { View, Button, Text, Image } from '@tarojs/components'
import { observer, inject, autorun } from '@tarojs/mobx'
import { getIns, Octo } from '../../utils/octokit'
import join from 'url-join'
import './index.less'
import { ImgZipType, ImgType } from 'src/utils/interface'
import { unzip } from '../../utils/helper'
import ConfigStore from '../../store/config'

type Props = {
  ConfigStore: typeof ConfigStore
}

type State = {
  path: string[]
  images: ImgType[]
  sha?: string
  lastSync?: string
  user?: {
    username: string
    avatar: string
  }
}

@inject('ConfigStore')
@observer
class Index extends Component<Props, State> {
  /**
   * 指定config的类型声明为: Taro.Config
   *
   * 由于 typescript 对于 object 类型推导只能推出 Key 的基本类型
   * 对于像 navigationBarTextStyle: 'black' 这样的推导出的类型是 string
   * 提示和声明 navigationBarTextStyle: 'black' | 'white' 类型冲突, 需要显示声明类型
   */
  config: Config = {
    navigationBarTitleText: '首页'
  }
  state: State = {
    path: [],
    images: [],
    sha: '',
    lastSync: '',
    user: null
  }
  octo: Octo = null
  constructor(p: Props) {
    super(p)
    const { ConfigStore } = p
    this.octo = ConfigStore.valid ? getIns(p.ConfigStore) : null
  }
  get path() {
    const { path } = this.state
    if (!path.length) return ''
    return join(...this.state.path)
  }

  parse(img: ImgZipType) {
    return {
      ...unzip(img),
      imgUrl: this.octo.parseUrl(img.f)
    }
  }
  async getData() {
    if(this.octo) {
      await this.getUser()
      await this.getImage()
    }
  }
  async getImage() {
    const { sha, data, lastSync } = await this.octo.getDataJson(this.path)
    this.setState({
      sha,
      images: data.map(each => this.parse(each as ImgZipType)),
      lastSync
    })
  }
  async getUser() {
    const user = await this.octo.getUser()
    this.setState({
      user
    })
  }
  // chooseImage = () => {
  //   chooseImage().then(r => {
  //     this.readFile(r.tempFilePaths[0])
  //   })
  // }
  // readFile = (filePath) => {
  //   console.log(filePath);
  //   wx.getFileSystemManager().readFile({
  //     filePath,
  //     encoding: 'base64',
  //     success: (r) => {
  //       console.log('read success');
  //     }
  //   })
  // }
  componentWillMount() {}

  componentWillReact() {}

  componentDidMount() {
    this.getData()
  }

  componentWillUnmount() {}

  componentDidShow() {}

  componentDidHide() {}

  render() {
    const { owner, repoName } = this.props.ConfigStore
    const { images, path, user } = this.state
    return (
      <View className='index'>
        {/* <Button onClick={this.chooseImage}>choose image</Button> */}
        <View className='user'>
          <Image className='avatar' mode='aspectFill' src={user.avatar} />
          {owner}
        </View>
        <View className='path-wrapper'>
          <View className="path-item repo-name">{repoName}</View>
          {path.map(each => (
            <View key={each} className='path-item'>{each}</View>
          ))}
        </View>
        <View className='image-list'>
          {images.map(each => (
            <View key={each.sha} className='image-wrapper'>
              <Image
                className='image-item'
                mode='aspectFill'
                src={each.imgUrl}
              />
            </View>
          ))}
        </View>
      </View>
    )
  }
}

export default Index as ComponentType
