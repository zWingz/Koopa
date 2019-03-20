import Taro, { Component } from '@tarojs/taro'
import { Image } from '@tarojs/components'
import { getIns } from '../utils/octokit';
import ConfigStore from '../store/config'

export default class LoadImage extends Component {
  src = ''
  constructor(p) {
    super(p)
  }
  async componentDidMount() {
    const ins = getIns(ConfigStore)
    const { content } = await ins.octokit.getBlob((this.props as any).sha)
    this.src = 'data:image/jpeg;base64,' + content.replace(/[\r\t\n]/g, '')
    this.forceUpdate()
  }
  render() {
    const { src } = this
    return <Image style={{width: '557px', height: '572px'}} mode='aspectFill' src={src}></Image>
  }
}
