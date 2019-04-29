import { ComponentType } from 'react'
import Taro, { Component, Config, chooseImage } from '@tarojs/taro'
import { View, Image, Button, Text } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx'
import { getIns, Octo, clearIns, DirType } from '../../utils/octokit'
import join from 'url-join'
import './index.less'
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
import { ImgType } from '../../utils/interface'
import MyImage from '../../components/Image'
import Path from './Path'
import Dir from './Dir'
import NoDataPng from '../../image/no-data.png'

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
  edit: boolean
}

const CONFIG_ERROR_MSG = '配置不正确，请修改后重试'
function getImageType(name) {
  return name.split('.').slice(-1)
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
    navigationBarTitleText: '首页',
    disableScroll: true
  }
  state: State = {
    pathArr: [],
    images: [],
    dir: {},
    user: null,
    error: ConfigStore.valid ? '' : CONFIG_ERROR_MSG,
    loading: true,
    modalShow: false,
    newPathName: '',
    edit: false
  }
  octo: Octo = null

  /**
   * 获取拼接后的path
   *
   * @readonly
   * @memberof Index
   */
  get path() {
    const { pathArr: path } = this.state
    if (!path.length) return ''
    return join(...this.state.pathArr)
  }

  /**
   * 根据图片名称以及路径, 设置图片的url
   *
   * @param {ImgType} img
   * @returns {ImgType}
   * @memberof Index
   */
  parse(img: ImgType): ImgType {
    return {
      ...img,
      url: this.octo.parseUrl(this.path, img.name)
    }
  }
  /**
   * 初始化octo
   * 如果Config修改了也会重新出发
   *
   * @memberof Index
   */
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

  /**
   * 路径名onChange事件
   *
   * @memberof Index
   */
  onNewPathChange = val => {
    this.setState({
      newPathName: val
    })
  }

  /**
   * 获取数据
   * 包括user和图片
   * 一般用在第一次加载或者修改Config之后
   *
   * @memberof Index
   */
  async getData() {
    if (this.octo) {
      try {
        this.octo.clearCache()
        await this.getUser()
        await this.getImage()
      } catch (e) {}
    }
  }
  /**
   * 获取当前路径图片列表
   *
   * @param {string} [sha]
   * @memberof Index
   */
  async getImage(sha?: string) {
    if (!this.state.loading) {
      this.setState({ loading: true, images: [], dir: {} })
    }
    try {
      const dataJson = await this.octo.getTree(this.path, sha)
      const { images, dir } = dataJson
      this.setState({
        // images: [],
        images: images.map(each => this.parse(each)),
        dir: { ...dir },
        loading: false
      })
      Taro.hideLoading()
    } catch (e) {
      this.setState({
        error: e.message,
        loading: false
      })
      Taro.hideLoading()
    }
  }
  /**
   * 获取用户信息
   *
   * @memberof Index
   */
  async getUser() {
    try {
      const user = await this.octo.getUser()
      this.setState({
        user
      })
    } catch (e) {
      this.setState({
        error: e.message,
        loading: false
      })
      throw e
    }
  }
  /**
   * 跳转到Setting
   *
   * @memberof Index
   */
  switchToSetting = () => {
    Taro.switchTab({
      url: '/pages/config/index'
    })
  }
  /**
   * 选择图片
   *
   * @memberof Index
   */
  onChooseImage = () => {
    chooseImage({
      count: 1
    }).then(
      r => {
        this.uploadImg(r.tempFilePaths[0])
      },
      () => {}
    )
  }
  uploadImg = async filePath => {
    const ext = filePath.split('.').pop()
    Taro.showLoading({
      title: '上传中...',
      mask: true
    })
    const content = await wxReadFile(filePath)
    await this.octo.uploadImage(this.path, {
      filename: `${new Date().getTime()}.${ext}`,
      base64: content
    })
    Taro.hideLoading()
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
    // this.setState({
    //   dir: {
    //     ...dir,
    //     [newPathName]: ''
    //   }
    // })
    this.enterDir(newPathName)
    this.hideModal()
  }
  /**
   * 进入目录
   * 并根据目录sha获取数据
   *
   * @memberof Index
   */
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
  /**
   * 回到某个目录
   * 一般都会有缓存, 直接从缓存中获取数据
   *
   * @memberof Index
   */
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
  /**
   * 切换编辑模式
   *
   * @memberof Index
   */
  toggleEdit = () => {
    this.setState({
      edit: !this.state.edit
    })
  }
  /**
   * 删除图片
   *
   * @memberof Index
   */
  onDelete = (img: ImgType) => {
    Taro.showModal({
      title: '操作提示',
      content: '确定要删除吗?'
    }).then(async res => {
      if (res.confirm) {
        Taro.showLoading()
        await this.octo.removeFile(this.path, img)
        Taro.hideLoading()
        Taro.atMessage({
          message: '删除成功',
          type: 'success'
        })
        this.getImage()
      }
    })
  }
  onPreview = (url: string) => {
    Taro.previewImage({
      urls: this.state.images.map(each => each.url),
      current: url
    })
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
      newPathName: newPath,
      edit
    } = this.state
    const DirKeys = Object.keys(dir)
    return !error ? (
      <View className='index flex flex-column'>
        <View className='user'>
          {user.avatar ? (
            <Image className='avatar' mode='aspectFill' src={user.avatar} />
          ) : (
            <View className='avatar' />
          )}
          <View className='username flex-grow'>{owner}</View>
          <AtButton type='secondary' size='small' onClick={this.showModal}>
            新建目录
          </AtButton>
          <AtButton type='secondary' size='small' onClick={this.toggleEdit}>
            删除图片
          </AtButton>
        </View>
        <Path repoName={repoName} path={path} onBack={this.backDir} />
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
              <View
                className='image-wrapper'
                style={{ position: 'relative' }}
                key={each.sha}>
                <MyImage
                  sha={each.sha}
                  url={each.url}
                  onClick={this.onPreview}
                  type={getImageType(each.name)}
                />
                {edit && (
                  <View
                    className='image-delete'
                    onClick={() => this.onDelete(each)}>
                    <AtIcon value='trash' size='22' color='#fff' />
                  </View>
                )}
              </View>
            ))}
            {
              !loading && !images.length && <View className="no-data">
                <Image src={NoDataPng} className='no-data-icon'/>
                <Text className='no-data-text'>暂无图片</Text>
              </View>
            }
          </View>
        </View>
        <AtButton onClick={this.onChooseImage}>上传</AtButton>
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
              <View>1. 上传了图片后文件夹才生效</View>
              <View>2. 无法修改文件夹名称</View>
              <View>3. 若文件夹无图片, 则自动删除</View>
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
