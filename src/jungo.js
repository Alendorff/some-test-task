'use strict';

const path    = require('path'),
      fs      = require('fs'),
      express = require('express'),
      router  = express.Router(),
      multer  = require('multer');

const {
        storeFileFromUrl,
        sendFileToHref,
        getUid,
        removeFilesFromDir,
        sha1
      }                      = require('./utils'),
      BULB_URL               = 'http://88.99.174.234:9090',
      UPLOAD_PATH            = path.resolve(__dirname, '../uploads'),
      DEFAULT_FILE_FIELDNAME = 'file';

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, UPLOAD_PATH)
    },
    filename: function (req, file, cb) {
      cb(null, getUid())
    }
  }),
  limits: {
    fileSize: 1024 * 1024 * 10,
    files: 1
  }
});


router.post('/api', upload.single('file'), (req, res, next) => {
  let files = {}; // pairs like {url:filePath}
  const bodyFields = Object.keys(req.body).filter((key) => req.body[key]);
  bodyFields.forEach((key) => {

    // Suggested that all requests will have unique fields
    if (Array.isArray(req.body[key]) && req.body[key].length) req.body[key] = req.body[key][0];

    files[req.body[key]] = path.join(UPLOAD_PATH, getUid());
  });

  const uniqueLinks = Object.keys(files);
  const promises = [];
  uniqueLinks.forEach((key) => {
    promises.push(storeFileFromUrl(key, files[key]));
  });
  if (req.file) {
    let fieldname = req.file.fieldname || DEFAULT_FILE_FIELDNAME;
    files[fieldname] = req.file.path;
    uniqueLinks.push(fieldname);
    promises.push(Promise.resolve(req.file.path));
  }

  Promise.all(promises)

  // send files one by one to remote server
    .then((paths) => {
      return Promise.all(paths.map((p) => sendFileToHref(p, BULB_URL)));
    })

    // handle bulbResponse: sha1(sha1(file body) + bulbResponse)
    .then((results) => {
      uniqueLinks.forEach((key, i) => {
        files[key] = sha1(Buffer.concat([sha1(fs.readFileSync(files[key])), Buffer.from(results[i])]), 'hex');
      });
      return files;
    })

    // format and send response
    // now files have the following format: files[body[key]] = hash
    .then((files) => {
      let response = {};
      bodyFields.forEach((field) => {
        response[field] = files[req.body[field]];
      });
      if (req.file) {
        const fieldname = req.file.fieldname || DEFAULT_FILE_FIELDNAME;
        response[fieldname] = files[fieldname];
      }
      res.send(response);
    })

    // request error handler
    .catch((err) => {
      next(err, req, res);
    })

    // clean up
    .then(() => {
      return removeFilesFromDir(UPLOAD_PATH);
    })
    .catch((err) => console.error(err));
});

module.exports = router;
