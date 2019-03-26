import Taro, { PureComponent } from '@tarojs/taro'
import { View } from '@tarojs/components'
export default class DirItem extends PureComponent<{
  path: string[],
  repoName: string
  onBack: (path: string) => void
}> {
  static defaultProps = {
    repoName: '',
    path: []
  }
  static options = {
    addGlobalClass: true
  }
  back = (event: any) => {
    const path = event.currentTarget.dataset.path
    if(path !== '..') {
      this.props.onBack(path)
    }
  }
  get path(): string[] {
    const { path } = this.props
    if(path.length < 4) {
      return path
    }
    return ['..'].concat(path.slice(-3))
  }
  render() {
    const { repoName } = this.props
    const { path } = this
    return (
      <View className='path-wrapper'>
        <View className='path-item repo-name' data-path='' onClick={this.back}>
          {repoName}
        </View>/
        {path.map(each => (
          <View key={each} className='flex'>
            <View
              className='path-item'
              data-path={each}
              onClick={this.back}>
              {each}
            </View>
            /
          </View>
        ))}
      </View>
    )
  }
}
