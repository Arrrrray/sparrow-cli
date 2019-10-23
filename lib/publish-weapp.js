const inquirer = require('inquirer'); // 启动交互命令行
const spawn = require('cross-spawn'); // 开启子进程
const fs = require("fs"); // 控制台输出
const jsonFormat = require("json-format"); // json格式化

const Config = require('../config'); // 配置项
const Log = require("../log"); // 控制台输出

// const originPrototype = require('./originPrototype'); // 继承原型


/* = deal Func
-------------------------------------------------------------- */
function getVersionChoices(version) {

  // 描述数组
  const vArrsDesc = ['raise major: ', 'raise minor: ', 'raise patch: ', 'raise alter: '];

  // 版本号(数组形态)
  let vArrs = version.split('.');

  // 版本号选项
  let choices = vArrsDesc.map((item, index, array) => {

    // 当配置文件内的版本号，位数不够时补0
    array.length > vArrs.length ? vArrs.push(0) : '';

    // 版本号拼接
    return vArrsDesc[index] + versionNext(vArrs, index)
  }).reverse();

  // 添加选项
  choices.unshift('no change');

  return choices;
}

// 增加版本号
function versionNext(array, idx) {
  let arr = [].concat(array);
  ++arr[idx];

  arr = arr.map((v, i) => i > idx ? 0 : v);

  // 当最后一位是0的时候, 删除
  if (!parseInt(arr[arr.length - 1])) arr.pop();

  return arr.join('.');
}

// 修改本地版本文件
function rewriteLocalVersionFile(filepath, versionConf) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filepath, jsonFormat(versionConf), err => {
      if (err) {
        Log.error(err);
        process.exit(1);
      } else {
        resolve();
      }
    })
  })
}

/* = define question
-------------------------------------------------------------- */

// 询问是否是发行版
function inquirerIsReleases() {
  return inquirer.prompt()
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
      type: 'list',
      name: 'version',
      message: `设置上传的版本号 (当前版本号: ${version}):`,
      default: 1,
      choices: getVersionChoices(version),
      filter(opts) {
        if (opts === 'no change') {
          return version;
        }
        return opts.split(': ')[1];
      },
      when(answer) {
        return !!answer.isRelease
      }
    },

    // 设置上传描述
    {
      type: 'input',
      name: 'versionDesc',
      message: `写一个简单的介绍来描述这个版本的改动过:`,
      default: versionDesc
    },
  ]
}



module.exports = async function (userConf) {
  // Command对象

  // ide路径
  const idePath = userConf.idePath || '/Applications/wechatwebdevtools.app/';

  // cli路径
  const cli = `${idePath}/Contents/Resources/app.nw/bin/cli`;
  // console.log('===第二步：写上传逻辑，2.1拿到cli路径cli', cli);

  // // 版本配置文件路径    
  const versionConfPath = '../sparrow.version.json';

  // // 获取版本配置
  const versionConf = require('../sparrow.version.json');
  // console.log('===第二步：写上传逻辑，2.2取版本配置versionConf', versionConf);


  // // 开始执行
  let answer = await inquirer.prompt(getQuestion(versionConf));
  // console.log('====第一步：拿到你需要的answer，此时是你输入的描述这个版本的信息', answer);
  const switchFunc = require('../switch');
  switchFunc(answer.isRelease).then(() => {
    versionConf.version = answer.version || '0.0.0';
    versionConf.versionDesc = answer.versionDesc;
    // console.log('===第二步：写上传逻辑，2.3问题队列（获取用户上传信息)versionConf', versionConf);


    // // 前置钩子函数
    // !!userConf.publishHook && !!userConf.publishHook.before && await userConf.publishHook.before.call(originPrototype, answer).catch(() => process.exit(1));

    //上传体验版
    // console.log('======', cli, ['-u', `${versionConf.version}@${Config.output}`, '--upload-desc', versionConf.versionDesc]);
    Log.success('上传开始...')

    let res = spawn.sync(cli, ['-u', `${versionConf.version}@${Config.dir_root}`, '--upload-desc', versionConf.versionDesc], {
      stdio: 'inherit'
    });
    Log.success('上传成功...')

    if (res.status !== 0) process.exit(1);
    // console.log('===第二步：写上传逻辑，2.4执行上传（cli命令）res为上传的结果');


    // 修改本地版本文件 (当为发行版时)
    !!answer.isRelease && rewriteLocalVersionFile(versionConfPath, versionConf);
    // console.log('===第二步：写上传逻辑，2.5执修改本地版本文件的版本号');



    // // 后置钩子函数
    // !!userConf.publishHook && !!userConf.publishHook.after && await userConf.publishHook.after.call(originPrototype, answer).catch(() => process.exit(1));

    // success tips
    Log.success(`上传体验版成功, 登录微信公众平台 https://mp.weixin.qq.com 获取体验版二维码`);
  });


  // console.log('===第二步：写上传逻辑，2.6执成功提示');


}