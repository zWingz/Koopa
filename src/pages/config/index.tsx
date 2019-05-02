import { ComponentType } from 'react'
import Taro, { Component, setStorageSync } from '@tarojs/taro'
import { View, Navigator } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx'
import './index.less'
import ConfigStore from '../../store/config'
import { AtInput, AtButton, AtSwitch } from 'taro-ui'

type Prop = {
  ConfigStore: typeof ConfigStore
}

@inject('ConfigStore')
@observer
class ConfigPage extends Component<Prop> {
  state = {
    token: '',
    repo: '',
    // branch: '',
    // customUrl: '',
    isPrivate: false
  }
  constructor(p: Prop) {
    super(p)
    const { token, repo, isPrivate } = p.ConfigStore
    this.setState({ token, repo, isPrivate })
  }
  handleChange = (key, value) => {
    this.setState({
      [key]: value
    })
  }
  save = () => {
    this.props.ConfigStore.setConfig(this.state)
    setStorageSync('config', this.state)
    Taro.showToast({
      title: '保存成功!'
    })
  }
  render() {
    const { repo, token } = this.state
    return (
      <View className='config-container'>
        <AtInput
          name='repo'
          title='仓库名'
          type='text'
          placeholder='username/repository'
          value={repo}
          onChange={value => this.handleChange('repo', value)}
        />
        <AtInput
          name='token'
          title='Token'
          type='text'
          placeholder='access token'
          value={token}
          onChange={value => this.handleChange('token', value)}
        />
        {/* <AtInput
          name='branch'
          title='分支'
          type='text'
          placeholder='所属分支'
          value={branch}
          onChange={value => this.handleChange('branch', value)}
        /> */}
        {/* <AtInput
          name='customUrl'
          title='自定义域名'
          type='text'
          placeholder='customUrl'
          value={customUrl}
          onChange={value => this.handleChange('customUrl', value)}
        /> */}
        <AtSwitch
          title='是否私有'
          checked={this.state.isPrivate}
          onChange={value => this.handleChange('isPrivate', value)}
        />
        <View className='submit-wrapper'>
          <AtButton type='primary' onClick={this.save}>
            保存
          </AtButton>
        </View>
        <Navigator className='to-document' url='/pages/document/index'>查看操作说明</Navigator>
        <View className='about-tips'>
          <View>注:</View>
          <View>1、以上信息只保存在本地, 不通过服务器</View>
          <View>2、图片会保存在用户个人建立的github仓库中</View>
          <View>3、如不提供token，则只可查看图片</View>
        </View>
      </View>
    )
  }
}
export default ConfigPage as ComponentType
