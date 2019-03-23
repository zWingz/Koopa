import Taro, { Component, Config, getStorageSync } from '@tarojs/taro'
import '@tarojs/async-await'
import { Provider } from '@tarojs/mobx'
import Index from './pages/index'
import ConfigStore from './store/config'
import "taro-ui/dist/style/components/input.scss";
import "taro-ui/dist/style/components/icon.scss";
import "taro-ui/dist/style/components/button.scss";
import "taro-ui/dist/style/components/loading.scss";
import "taro-ui/dist/style/components/activity-indicator.scss";
import "taro-ui/dist/style/components/switch.scss";
import "taro-ui/dist/style/components/modal.scss";
import "taro-ui/dist/style/components/message.scss"
import './app.less'

const store = {
  ConfigStore
}

class App extends Component {

  /**
   * 指定config的类型声明为: Taro.Config
   *
   * 由于 typescript 对于 object 类型推导只能推出 Key 的基本类型
   * 对于像 navigationBarTextStyle: 'black' 这样的推导出的类型是 string
   * 提示和声明 navigationBarTextStyle: 'black' | 'white' 类型冲突, 需要显示声明类型
   */
  config: Config = {
    pages: [
      'pages/index/index',
      'pages/config/index'
    ],
    tabBar: {
      selectedColor: '#d4237a',
      list: [{
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'image/导航-首页.png',
        selectedIconPath: 'image/导航-首页-ac.png'
      }, {
        pagePath: 'pages/config/index',
        text: '设置',
        iconPath: 'image/设置.png',
        selectedIconPath: 'image/设置-ac.png'
      }]
    },
    window: {
      backgroundTextStyle: 'light',
      navigationBarBackgroundColor: '#fff',
      navigationBarTitleText: 'WeChat',
      navigationBarTextStyle: 'black'
    }
  }

  constructor() {
    super()
    const config = getStorageSync('config')
    if(config) {
      ConfigStore.setConfig(config)
    }

  }

  componentDidMount () {}

  componentDidShow () {}

  componentDidHide () {}

  componentDidCatchError () {}

  // 在 App 类中的 render() 函数没有实际作用
  // 请勿修改此函数
  render () {
    return (
      <Provider store={store}>
        <Index />
      </Provider>
    )
  }
}

Taro.render(<App />, document.getElementById('app'))
