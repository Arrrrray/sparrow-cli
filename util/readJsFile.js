const fs = require("fs");
const Log = require("../log"); // 控制台输出

// 异步写文件
module.exports = async function (filepath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filepath, (err, data) => {
      if (err) {
        // throw new Error(`Error occurs when reading file ${sourceFile}.\nError detail: ${err}`)
        Log.error(err);
        process.exit(1)
      } else {
        resolve({
          code: 1,
          mesage: JSON.parse(data)
        });
      }

    })
    resolve();
  })
}