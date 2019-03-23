import { ComponentType } from 'react'
import Taro, {
  Component,
  Config,
  chooseImage,
  PureComponent
} from '@tarojs/taro'
import { View, Image, Button } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx'
import {
  getIns,
  Octo,
  clearIns,
  DirType,
  DataJsonType,
  cache,
  clone
} from '../../utils/octokit'
import join from 'url-join'
import './index.less'
import { ImgType } from 'src/utils/interface'
import { unzip } from '../../utils/helper'
import ConfigStore from '../../store/config'
import { autorun } from 'mobx'
import {
  AtButton,
  AtIcon,
  AtActivityIndicator,
  AtModal,
  AtModalHeader,
  AtModalContent,
  AtModalAction,
  AtInput,
  AtMessage
} from 'taro-ui'
import { wxReadFile } from '../../utils/wx'
import MyImage from '../../components/Image'
import Dir from './Dir'
import '../../image/folder.png'
// import '../../components/LoadImage'

type Props = {
  ConfigStore: typeof ConfigStore
}

type State = {
  pathArr: string[]
  images: ImgType[]
  dir: DirType
  user?: {
    username: string
    avatar: string
  }
  loading: boolean
  error: string
  modalShow: boolean
  newPathName: string
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
    pathArr: [],
    images: [],
    dir: {},
    user: null,
    error: ConfigStore.valid ? '' : CONFIG_ERROR_MSG,
    loading: true,
    modalShow: false,
    newPathName: ''
  }
  octo: Octo = null
  get path() {
    const { pathArr: path } = this.state
    if (!path.length) return ''
    return join(...this.state.pathArr)
  }

  parse(img: ImgType): ImgType {
    return {
      ...img,
      url: this.octo.parseUrl(this.path, img.name)
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
        pathArr: [],
        images: [],
        user: null,
        error: ''
      })
      clearIns()
    }
    this.octo = getIns(ConfigStore)
    this.getData()
  }

  onNewPathChange = val => {
    this.setState({
      newPathName: val
    })
  }

  async getData() {
    if (this.octo) {
      await this.getUser()
      await this.getImage()
    }
  }
  async getImage(sha?: string) {
    if (!this.state.loading) {
      this.setState({ loading: true })
    }
    try {
      const dataJson = await this.octo.getTree(this.path, sha)
      const { images, dir } = dataJson
      this.setState({
        images: images.map(each => this.parse(each)),
        dir: { ...dir },
        loading: false
      })
    } catch (e) {
      this.setState({
        error: e.message
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
    chooseImage({
      count: 1
    }).then(r => {
      this.uploadImg(r.tempFilePaths[0])
    })
  }
  uploadImg = async filePath => {
    const ext = filePath.split('.').pop()
    const content = await wxReadFile(filePath)
    await this.octo.uploadImage(this.path, {
      filename: `${new Date().getTime()}.${ext}`,
      base64: content
    })
    this.getImage()
  }
  showModal = () => {
    this.setState({
      modalShow: true
    })
  }
  hideModal = () => {
    this.setState({
      modalShow: false,
      newPathName: ''
    })
  }
  savePath = () => {
    const { newPathName, dir } = this.state
    if (newPathName in dir) {
      Taro.atMessage({
        message: '目录已存在',
        type: 'error'
      })
      return
    }
    this.octo.createPath(this.path, newPathName)
    this.setState({
      dir: {
        ...dir,
        [newPathName]: ''
      }
    })
    this.hideModal()
  }
  enterDir = (name: string, sha?: string) => {
    const { pathArr } = this.state
    this.setState(
      {
        pathArr: pathArr.concat(name)
      },
      () => {
        this.getImage(sha)
      }
    )
  }
  backDir = (name: string) => {
    const { pathArr } = this.state
    let target = []
    if (name) {
      const index = pathArr.indexOf(name)
      if (index === pathArr.length - 1) return
      target = pathArr.slice(0, index + 1)
    }
    this.setState(
      {
        pathArr: target
      },
      () => {
        this.getImage()
      }
    )
  }
  componentWillMount() {}

  componentWillReact() {}

  componentDidMount() {
    autorun(() => {
      this.initOcto()
    })
    // this.getData()
  }
  componentWillUnmount() {}

  componentDidShow() {}

  componentDidHide() {}

  render() {
    const { owner, repoName } = ConfigStore
    const {
      images,
      pathArr: path,
      user,
      error,
      loading,
      dir,
      modalShow: show,
      newPathName: newPath
    } = this.state
    const DirKeys = Object.keys(dir)
    return !error ? (
      <View className='index flex flex-column'>
        <View className='user'>
          <Image className='avatar' mode='aspectFill' src={user.avatar} />
          <View className='username flex-grow'>{owner}</View>
          <AtButton
            type='secondary'
            size='small'
            className='path-create'
            onClick={this.showModal}>
            新建目录
          </AtButton>
        </View>
        <View className='path-wrapper'>
          <View
            className='path-item repo-name'
            onClick={() => this.backDir('')}>
            {repoName}
          </View>
          {path.map(each => (
            <View
              key={each}
              className='path-item'
              onClick={() => this.backDir(each)}>
              {each}
            </View>
          ))}
        </View>
        <View className='image-container flex-grow'>
          {loading && (
            <AtActivityIndicator mode='center' content='Loading...' />
          )}
          <View className='image-inner'>
            {DirKeys.map(each => {
              const d = dir[each]
              return <Dir key={d} name={each} sha={d} onEnter={this.enterDir} />
            })}
            {images.map(each => (
              <MyImage sha={each.sha} imgUrl={each.url} key={each.sha} />
            ))}
          </View>
        </View>
        <AtButton onClick={this.chooseImage}>上传</AtButton>
        <AtModal isOpened={show}>
          <AtModalHeader>新建目录</AtModalHeader>
          <AtModalContent>
            <AtInput
              name='newPath'
              placeholder='输入目录名'
              value={newPath}
              onChange={this.onNewPathChange}
            />
            <View className='tips'>
              <View>提示:</View>
              <View>1. 只有上传了图片后目录才生效</View>
              <View>2. 目录生效后无法修改名称</View>
            </View>
          </AtModalContent>
          <AtModalAction>
            <Button onClick={this.hideModal}>取消</Button>
            <Button disabled={!newPath} onClick={this.savePath}>
              确定
            </Button>
          </AtModalAction>
        </AtModal>
        <AtMessage />
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
