import { ComponentType } from 'react'
import Taro, { Component, Config, chooseImage } from '@tarojs/taro'
import { View, Image } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx'
import { getIns, Octo, clearIns } from '../../utils/octokit'
import join from 'url-join'
import './index.less'
import { ImgZipType, ImgType } from 'src/utils/interface'
import { unzip } from '../../utils/helper'
import ConfigStore from '../../store/config'
import { autorun } from 'mobx'
import { AtButton, AtIcon, AtActivityIndicator } from 'taro-ui'
import { readFile } from '../../utils/wx';

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
  loading: boolean
  hasDataJson: boolean
  error: string
}

const CONFIG_ERROR_MSG = '配置不正确，请修改后重试'

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
    user: null,
    error: ConfigStore.valid ? '' : CONFIG_ERROR_MSG,
    loading: true,
    hasDataJson: false
  }
  octo: Octo = null
  get path() {
    const { path } = this.state
    if (!path.length) return ''
    return join(...this.state.path)
  }

  parse(img: ImgZipType) {
    return {
      ...unzip(img),
      imgUrl: this.octo.parseUrl(this.path, img.f)
    }
  }
  initOcto() {
    if (!ConfigStore.valid) {
      this.octo = null
      this.setState({
        error: CONFIG_ERROR_MSG
      })
      return
    } else {
      this.setState({
        path: [],
        images: [],
        user: null,
        error: ''
      })
      clearIns()
    }
    this.octo = getIns(ConfigStore)
    this.getData()
  }

  async getData() {
    if (this.octo) {
      await this.getUser()
      await this.getImage()
    }
  }
  async getImage() {
    if (!this.state.loading) {
      this.setState({ loading: true })
    }
    try {
      const { sha, data } = await this.octo.getDataJson(this.path)
      console.log(data);
      this.setState({
        sha,
        images: data.map(each => this.parse(each as ImgZipType)),
        loading: false
      })
    } catch (e) {
      this.setState({
        error: 'e.message'
      })
    }
  }
  async getUser() {
    try {
      const user = await this.octo.getUser()
      this.setState({
        user
      })
    } catch (e) {
      this.setState({
        error: 'Token似乎失效了！'
      })
    }
  }
  switchToSetting = () => {
    Taro.switchTab({
      url: '/pages/config/index'
    })
  }
  chooseImage = () => {
    chooseImage().then(r => {
      this.readFile(r.tempFilePaths[0])
    })
  }
  readFile = async (filePath) => {
    const ext = filePath.split('.').pop()
    const content = await readFile(filePath)
    console.log('read success');
    // console.log(r)
    await this.octo.upload(this.path, {
      filename: `${new Date().getTime()}.${ext}`,
      base64: content
    })
    this.octo.updateOrCreateDataJson(this.path)
  }
  updateOrCreateDataJson() {

  }
  componentWillMount() {}

  componentWillReact() {}

  componentDidMount() {
    autorun(() => {
      console.log('auturon')
      this.initOcto()
    })
    // this.getData()
  }
  componentWillUnmount() {}

  componentDidShow() {}

  componentDidHide() {}

  render() {
    const { owner, repoName } = ConfigStore
    const { images, path, user, error, loading } = this.state
    return !error ? (
      <View className='index flex flex-column'>
        <View className='user'>
          <Image className='avatar' mode='aspectFill' src={user.avatar} />
          <View className="username">
            {owner}
          </View>
        </View>
        <View className='path-wrapper'>
          <View className='path-item repo-name'>{repoName}</View>
          {path.map(each => (
            <View key={each} className='path-item'>
              {each}
            </View>
          ))}
        </View>
        <View className='image-container flex-grow'>
          {loading && (
            <AtActivityIndicator mode='center' content='Loading...' />
          )}
          <View className="image-inner">
            {images.map(each => (
              <View key={each.sha} className='image-wrapper'>
                <Image
                  lazyLoad
                  className='image-item'
                  mode='aspectFill'
                  src={each.imgUrl}
                />
              </View>
            ))}
          </View>
        </View>
        <AtButton onClick={this.chooseImage}>上传</AtButton>
      </View>
    ) : (
      <View className='empty-container flex-center flex-column'>
        <AtIcon value='close-circle' size={64} />
        <View>{error}</View>
        <AtButton type='primary' onClick={this.switchToSetting}>
          去设置
        </AtButton>
      </View>
    )
  }
}

export default Index as ComponentType
