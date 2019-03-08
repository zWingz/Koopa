import { observable, action } from 'mobx'

interface Config {
  token: string
  repo: string
  customUrl: string
  branch: string
}

class Config {
  @observable
  token:string = ''

  @observable
  repo:string = ''

  @observable
  customUrl:string = ''

  @observable
  branch:string = 'master'

  @action
  setConfig(config: {[t in keyof Config]?: string}) {
    Object.keys(config).forEach((each: keyof Config) => {
      this.setKey(each, config[each])
    })
  }

  private setKey(key: keyof Config, value) {
    this[key] = value
  }
}

export default new Config()
