'use strict';

const http               = require('http'),
      https              = require('https'),
      fs                 = require('fs'),
      path               = require('path'),
      crypto             = require('crypto'),
      url                = require('url'),
      request            = require('request'),
      requestPromise     = require('request-promise-native'),
      {
        BadRequest,
        NotFound,
        GatewayTimeout
      }                  = require('./errors'),
      FETCH_FILE_TIMEOUT = 10000,
      SEND_FILE_TIMEOUT  = 5000;

/**
 * Generates a unique string sequence
 * @returns {string}
 */
const getUid = function () {
  return crypto.randomBytes(16).toString('hex');
};

/**
 * Calculates sha1 hash of provided buffer
 * @param buf
 * @param digest default is "" - empty string
 * @returns {Buffer|string}
 */
const sha1 = function (buf, digest = '') {
  return crypto.createHash('sha1').update(buf).digest(digest)
};

/**
 * Get remote file content and save it in filePath
 * @param href
 * @param filePath must be absolute
 * @returns {Promise<string>} filePath
 */
const storeFileFromUrl = function (href, filePath) {
  let fileUrl = href;

  if (href.indexOf('http://') !== 0 && href.indexOf('https://') !== 0) {
    fileUrl = 'http://' + href;
  }

  const options = {
    uri: fileUrl,
    timeout: FETCH_FILE_TIMEOUT
  };

  return new Promise((resolve, reject) => {
    request.get(options)
      .on('error', (err) => {
        if (err.code === 'ETIMEDOUT') {
          return reject(new GatewayTimeout(`Remote server didn't respond in time on file GET request. Url="${href}"`));
        } else if (err.code === 'ENOTFOUND') {
          return reject(new NotFound(`Resource with url="${href}" not found.`))
        } else {
          return reject(new Error(err.message || err));
        }
      })
      .pipe(fs.createWriteStream(filePath).on('error', reject))
      .on('close', () => resolve(filePath));
  });
};

/**
 * I wanted to avoid file storage but I can't send buffer instead of stream inside formData, because "Bulb" service
 * can't work with it So the most dummy but working way - store file -> send file from fs
 * @param filePath
 * @param href
 * @returns {Promise}
 */
const sendFileToHref = function (filePath, href) {
  const stream = fs.createReadStream(filePath);
  const options = {
    uri: url.parse(href),
    timeout: SEND_FILE_TIMEOUT,
    formData: {
      file: {
        value: stream,
        options: {
          filename: '',
          contentType: null
        }
      }
    }
  };
  return requestPromise.post(options)
    .then((res) => {

      // res is a some hash string
      return res;
    })
    .catch((err) => {
      if (err.message === 'Error: ETIMEDOUT') {
        throw new GatewayTimeout('Bulb service did not respond in time on POST request.');
      }
      else if (err.statusCode === 422) {
        throw new BadRequest(err.message || err);
      } else {
        throw err;
      }
    });
};

/**
 *
 * @param dirpath
 * @returns {Promise}
 */
const removeFilesFromDir = function (dirpath) {
  return new Promise((resolve, reject) => {
    fs.readdir(dirpath, (err, files) => {
      if (err) return reject(err);

      const errors = [];
      for (const file of files) {
        fs.unlink(path.join(dirpath, file), err => {
          if (err) {
            errors.push(err);
          }
        });
      }
      if (errors.length) reject(new Error(errors));
      else resolve(null);
    });
  });
};

module.exports = {
  getUid,
  sha1,
  storeFileFromUrl,
  sendFileToHref,
  removeFilesFromDir
};
