import { ComponentType } from 'react'
import Taro, { Component, setStorageSync } from '@tarojs/taro'
import { View } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx'
import './index.less'
import ConfigStore from '../../store/config'
import { AtInput, AtButton } from 'taro-ui'

type Prop = {
  ConfigStore: typeof ConfigStore
}

@inject('ConfigStore')
@observer
class ConfigPage extends Component<Prop> {
  state = {
    token: '',
    repo: '',
    branch: '',
    customUrl: ''
  }
  constructor(p: Prop) {
    super(p)
    const { token, repo, branch, customUrl } = p.ConfigStore
    this.setState({ token, repo, branch, customUrl })
  }
  handleChange = (key, value) => {
    this.setState({
      [key]: value
    })
  }
  save = () => {
    this.props.ConfigStore.setConfig(this.state)
    setStorageSync('config', this.state)
  }
  render() {
    const { repo, token, branch, customUrl } = this.state
    return (
      <View className='config-container'>
        <AtInput
          name='repo'
          title='仓库名'
          type='text'
          placeholder='owner/repo'
          value={repo}
          onChange={value => this.handleChange('repo', value)}
        />
        <AtInput
          name='token'
          title='Token'
          type='text'
          placeholder='personal access token'
          value={token}
          onChange={value => this.handleChange('token', value)}
        />
        <AtInput
          name='branch'
          title='分支'
          type='text'
          placeholder='所属分支'
          value={branch}
          onChange={value => this.handleChange('branch', value)}
        />
        <AtInput
          name='customUrl'
          title='自定义域名'
          type='text'
          placeholder='customUrl'
          value={customUrl}
          onChange={value => this.handleChange('customUrl', value)}
        />
        <View className='submit-wrapper'>
          <AtButton type='primary' onClick={this.save}>保存</AtButton>
        </View>
      </View>
    )
  }
}

export default ConfigPage as ComponentType
