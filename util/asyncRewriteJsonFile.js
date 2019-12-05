const fs = require("fs");
const jsonFormat = require("json-format"); // json格式化
const Log = require("../log"); // 控制台输出

// 异步写文件
module.exports = async function (filepath, conf, newConf) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filepath, jsonFormat({ ...conf, ...newConf }), err => {
      if (err) {
        Log.error(err);
        process.exit(1);
      } else {
        resolve({
          code: 1,
          mesage: '文件写入成功'
        });
      }
    });
  });
}