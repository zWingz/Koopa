import Taro, { Component, Config } from '@tarojs/taro'
import { Image } from '@tarojs/components'
import ConfigStore from '../../store/config'
import '../Base64Image/index'
export default class MyImage extends Component<{
  sha: string
  url: string
  type: string
  onClick: (url: string) => void
}> {
  static options = {
    addGlobalClass: true
  }
  config: Config = {
    usingComponents: {
      'base-image': '../../components/Base64Image/index'
    }
  }
  // state = {
  //   loaded: false
  // }
  // onLoad = () => {
  //   this.setState({
  //     loaded: true
  //   })
  // }
  onClick = () => {
    const { onClick, url } = this.props
    onClick && onClick(url)
  }
  render() {
    const { url, sha, type } = this.props
    return ConfigStore.isPrivate ? (
      <base-image sha={sha} bindload={this.onLoad} type={type} />
    ) : (
      <Image
        lazyLoad
        className='image-item'
        mode='aspectFill'
        src={url}
        // onLoad={this.onLoad}
        onClick={this.onClick}
      />
    )
  }
}
