import { ComponentType } from 'react'
import Taro, { Component } from '@tarojs/taro'
import { View, Label } from '@tarojs/components'
import './index.less'

class Document extends Component {
  render() {
    return (
      <View>
        <View className='config-tips'>
          <View>操作流程:</View>
          <View>
            1、在<Label>www.github.com</Label>注册账号
          </View>
          <View>
            2、右上角点<Label>+</Label>号, 选择<Label>new repository</Label>,
            新建仓库
          </View>
          <View>
            3、填入名字, 自行选择<Label>public</Label>或<Label>private</Label>,
            勾选<Label>Initialize this repository with a README</Label>
          </View>
          <View>
            4、点击右上角个人头像, 点击<Label>settings</Label>
          </View>
          <View>
            5、左侧点击<Label>Developer settings</Label> ->{' '}
            <Label>Personal access tokens</Label> ->
            <Label>Generate new token</Label>
          </View>
          <View>
            6、输入描述, 勾选<Label>repo</Label>, 点生成后自行保存
            <Label>token</Label>
          </View>
          <View>7、回到小程序, 依次填入相关信息</View>
          <View>
            8、仓库名格式为: <Label>用户名/仓库</Label>
          </View>
          <View>9、Token填入刚刚生成的</View>
          <View>
            10、如果仓库选择<Label>private</Label>, 则打开私有开关
          </View>
          <View>11、保存即可上传图片, 最终保存到仓库中</View>
        </View>
      </View>
    )
  }
}

export default Document as ComponentType
