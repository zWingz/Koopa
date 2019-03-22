import Taro, { Component, Config } from '@tarojs/taro'
import { Image } from '@tarojs/components'
import ConfigStore from '../../store/config'
export default class MyImage extends Component<{
  sha: string
  imgUrl: string
}> {
  static options = {
    addGlobalClass: true
  }
  config: Config = {
    usingComponents: {
      'base-image': '../../components/Base64Image/index'
    }
  }
  render() {
    const { imgUrl, sha } = this.props
    return ConfigStore.isPrivate ? (
      <base-image sha={sha} />
    ) : (
      <Image lazyLoad className='image-item' mode='aspectFill' src={imgUrl} />
    )
  }
}
