import { observable, action, computed } from 'mobx'

interface ConfigKey {
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

  @computed get owner() {
    return this.repo.split('/')[0]
  }

  @computed get repoName() {
    return this.repo.split('/')[1]
  }

  @action
  setConfig(config: {[t in keyof ConfigKey]?: string}) {
    Object.keys(config).forEach((each: keyof ConfigKey) => {
      this.setKey(each, config[each])
    })
  }

  private setKey(key: keyof ConfigKey, value) {
    this[key] = value
  }
  @computed
  get valid() {
    return this.owner && this.repoName && this.token
  }
}

export default new Config()
