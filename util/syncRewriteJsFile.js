const fs = require("fs");
const Log = require("../log"); // 控制台输出

// 异步写文件
module.exports = async function (filepath, text, tips, format) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filepath, text, format, (err) => {
      if (err) {
        // throw new Error(`error occurs when reading file ${sourceFile}. Error detail: ${err}`)
        Log.error(err);
        process.exit(1)
      } else {
        Log.success(tips);
      }
    })
    resolve();
  });
}