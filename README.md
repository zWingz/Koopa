## Koopa

### 操作步骤

#### github 端操作

- 注册[github](https://github.com/)账号
- [新建](https://github.com/new)一个仓库
  - 名字随意写
  - `private`会比`public`限制多一些, 具体选哪个看个人, 下面有说明
  - 勾选`Initialize this repository with a README`(主要为了让仓库至少有一个`file`, 否则回出错)
- 添加[personal token](https://github.com/settings/tokens/new)
  - `Token description`随意写, 主要让自己知道该`token`用来做什么
  - 权限勾选`repo`
  - 点击`Generate token`
  - 保存`token` (自行保存, 页面关闭后就找不回来, 只能重新生成)

#### 小程序端操作

- 点设置
- 仓库名: `username/repo` (github 用户名/刚注册的仓库名)
- Token: `personal token`
- 分支: `master`(如果不明白就不需要改)
- 是否私有: 根据仓库是否为`private`来设置
- 点保存
- 回首页, 即可上传图片

#### 额外说明

##### 仓库的 private 和 public 区别

github 仓库分为公有和私有

- 公有: 即所有人都可以访问, 但只能读不能操作
- 私有: 只有仓库所有人可以访问和操作

对于`private`项目, 无法通过`url`获取图片, 所以此处做了一步转换, 因此会比`public`在加载图片时慢一些.

##### 图片管理

- 目前只能一次上传/删除一张图片
- 如果文件夹下没有`图片`/`子文件夹`,该文件夹也会被删除,即不存在空文件夹
