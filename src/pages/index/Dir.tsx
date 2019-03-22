import Taro, { PureComponent } from '@tarojs/taro'
import { View, Image } from '@tarojs/components'
export default class DirItem extends PureComponent<{
  name: string
  sha: string
}> {
  static options = {
    addGlobalClass: true
  }
  render() {
    return (
      <View className='dir flex-center flex-column'>
        <View className="flex-center flex-column flex-grow">
          <Image mode='aspectFill' src='../../image/folder.png' />
        </View>
        <View className='dir-name'>{this.props.name}</View>
      </View>
    )
  }
}
