const express = require('express');
const multer = require('multer');
const archiver = require('archiver');
const { spawn } = require('child_process');
const path = require('path');
const storage = multer.memoryStorage();

const app = express();
const port = 3000;

// 🧠 Step 1: Use in-memory uploads
const upload = multer({ storage: storage,
    limits: { 
        files:50, // Limit to 50 files per request
        fileSize: 100 * 1024 * 1024 } // Optional: limit each file to 100MB
 });
app.use(express.static('public')); // for your frontend

// 💡 Format mapping
const mimeExtMap = {
  'image/heic': '.heic',
  'image/x-adobe-dng': '.dng',
  'image/dng': '.dng',
};

app.post('/upload', upload.array('images', 50), async (req, res) => {  //Handle the uploaded files here
  const format = req.body.format || 'jpg'; // 'jpg', 'webp', 'png'
  const quality = parseInt(req.body.quality) || 90;

  res.setHeader('Content-Type', 'application/zip');
  res.send('Files uploaded successfully.');
  res.setHeader('Content-Disposition', 'attachment; filename="converted_images.zip"');

  // 🧱 Step 4: Create zip archive and pipe to response
  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);

  const conversions = req.files.map((file, index) => {
    return new Promise((resolve, reject) => {
      const ext = mimeExtMap[file.mimetype] || path.extname(file.originalname) || '';
      const baseName = path.basename(file.originalname, ext);
      const outputName = `${baseName}.${format}`;

      // 🧠 Step 3: Spawn ImageMagick to convert in-memory
      const magick = spawn('magick', [
        '-', // input from stdin
        '-quality', `${quality}`,
        `${format}:-` // output to stdout
      ]);

      // handle errors
      magick.on('error', err => reject(`Failed to start magick: ${err}`));
      magick.stderr.on('data', data => console.error(`Magick stderr: ${data}`));
      magick.on('close', code => {
        if (code !== 0) reject(`Magick exited with code ${code}`);
        else resolve();
      });

      // Pipe output of magick directly to the zip archive
      const entry = archive.append(magick.stdout, { name: outputName });

      // Write buffer to stdin
      magick.stdin.write(file.buffer);
      magick.stdin.end();
    });
  });

  try {
    await Promise.all(conversions);
    archive.finalize(); // 📦 Step 5: finish zip stream
  } catch (err) {
    console.error('Conversion error:', err);
    res.status(500).send('❌ Error converting images: ' + err);
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
