import Taro, { PureComponent } from '@tarojs/taro'
import { View, Image } from '@tarojs/components'
import FolderPng from '../../image/folder.png'

export default class DirItem extends PureComponent<{
  name: string
  sha: string
  onEnter: (name: string, sha: string) => void
}> {
  static options = {
    addGlobalClass: true
  }
  onClick = () => {
    const { name, sha } = this.props
    this.props.onEnter(name, sha)
  }
  render() {
    return (
      <View className='dir flex-center flex-column' onClick={this.onClick}>
        <View className='flex-center flex-column flex-grow'>
          <Image mode='aspectFill' src={FolderPng} />
        </View>
        <View className='dir-name'>{this.props.name}</View>
      </View>
    )
  }
}
