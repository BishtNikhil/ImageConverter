// const { parentPort } = require('worker_threads');
// const { exec } = require('child_process');

// parentPort.on('message', ({ inputPath, outputPath, quality }) => {
//   const command = `magick "${inputPath}" -quality ${quality} "${outputPath}"`;

//   exec(command, (err) => {
//     if (err) {
//       parentPort.postMessage({ success: false, error: err.message });
//     } else {
//       parentPort.postMessage({ success: true, outputPath });
//     }
//   });
// });
