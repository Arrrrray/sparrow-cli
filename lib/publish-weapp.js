const inquirer = require('inquirer'); // 启动交互命令行
const spawn = require('cross-spawn'); // 开启子进程
const fs = require("fs");
const jsonFormat = require("json-format"); // json格式化
const Config = require('../config'); // 配置项
const Log = require("../log"); // 控制台输出

// 修改本地package.json文件
function rewritePackageConfigFile(filepath, packageConf, newConf) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filepath, jsonFormat({ ...packageConf, ...newConf }), err => {
      if (err) {
        Log.error(err);
        process.exit(1);
      } else {
        resolve(2);
      }
    });
  });
}

function getQuestion({
  version,
  versionDesc
} = {}) {
  return [{
    type: 'confirm',
    name: 'isRelease',
    message: '是否为正式发布版本?',
    default: true
  },
  // 设置版本号
  {
    type: 'input',
    name: 'version',
    message: `版本号(当前版本号:${version}):`,
    default: version
  },
  // 设置上传描述
  {
    type: 'input',
    name: 'versionDesc',
    message: `写一个简单的介绍来描述这个版本的改动:`,
    default: versionDesc
  }];
}
// exec('"C:\Program Files (x86)\Tencent\微信web开发者?工具\微信开发者工具.exe"');
module.exports = async function () {
  let idePath; //ide路径
  let cli; //官方提供的脚手架路径
  // ide路径 判断不同的平台得到不同的ide地址
  if (process.platform == ('win32' || 'win64')) {
    cli = "C:/\Program Files (x86)/\Tencent/\微信web开发者工具/\cli.bat";
  } else {
    idePath = '/Applications/wechatwebdevtools.app/';
    cli = `${idePath}/Contents/Resources/app.nw/bin/cli`;
  }

  // 版本package文件路径    
  const packageConfPath = `${Config.dir_root}/package.json`;

  //  获取package配置
  const packageConf = require(packageConfPath);

  const versionConfig = {
    version: packageConf.version,
    versionDesc: packageConf.versionDesc,
  }

  // 开始执行
  let answer = await inquirer.prompt(getQuestion(versionConfig));

  // 不输入版本号会默认使用上次的版本号
  if (answer.version == '') answer.version = versionConfig.version;
  const switchFunc = require('../switch');
  switchFunc(answer.isRelease).then(() => {
    if (answer.isRelease) {
      answer.versionDesc = `正式：${answer.versionDesc}`;
    } else {
      answer.versionDesc = `测试：${answer.versionDesc}`;
    }
    versionConfig.version = answer.version;
    versionConfig.versionDesc = answer.versionDesc;

    //上传体验版
    let res = spawn.sync(cli, ['-u', `${versionConfig.version}@${Config.dir_root}`, '--upload-desc', versionConfig.versionDesc], {
      stdio: 'inherit'
    });
    if (res.status !== 0) process.exit(1);
    Log.success('上传成功...');

    // 修改本地package.json文件 (当为发行版时)
    rewritePackageConfigFile(packageConfPath, packageConf, versionConfig).then(res => {
      if (res === 2) {
        Log.success('package.json文件修改成功！！！');
      }
    });

    // success tips
    Log.success(`上传体验版成功, 登录微信公众平台 https://mp.weixin.qq.com 获取体验版二维码`);
  });
};