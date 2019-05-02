import { observable, action, computed } from 'mobx'
import { Config } from '../utils/interface';


class ConfigStore {
  @observable
  token:string = ''

  @observable
  repo:string = ''

  @observable
  customUrl:string = ''

  @observable
  branch:string = 'master'

  @observable
  isPrivate: boolean = false

  @computed get owner() {
    return this.repo.split('/')[0]
  }

  @computed get repoName() {
    return this.repo.split('/')[1]
  }

  @action
  setConfig(config: {[t in keyof Config]?: string | boolean}) {
    Object.keys(config).forEach((each: keyof Config) => {
      this.setKey(each, config[each])
    })
  }

  private setKey(key: keyof Config, value) {
    this[key] = value
  }
  @computed
  get valid() {
    return this.owner && this.repoName
  }
}

export default new ConfigStore()
