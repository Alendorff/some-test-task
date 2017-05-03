'use strict';

const chai     = require('chai'),
      chaiHttp = require('chai-http'),
      fs       = require('fs'),
      path     = require('path'),
      app      = require('../');

chai.should();
chai.use(chaiHttp);

describe('jungo /api tests:', function () {
  this.timeout(30000);

  const testFilePath = path.resolve(__dirname, './test-image.jpg');
  const MIN_HASH_LEN = 4;

  const testJSON = {
    page: "https://ya.ru",
    cat: "http://i3.ytimg.com/vi/J---aiyznGQ/mqdefault.jpg",
    music: "https://cs1-50v4.vk-cdn.net/p8/f00787d59ece64.mp3"
  };

  let resultHashFile;
  let resultHashJSON;

  it('> possible to send file', () => {
    return chai.request(app)
      .post('/api')
      .attach('file', fs.readFileSync(testFilePath), 'test-file.jpg')
      .then((res) => {
        res.should.have.status(200);
        res.body.should.have.property('file');
        res.body.file.should.be.a('string');

        // there is no precise information about hash which will be sent in response
        // so, will think if some string here, that's it.
        res.body.file.should.have.property('length').which.gt(MIN_HASH_LEN);
        resultHashFile = res.body.file;
      });
  });

  it('> hashes should be the same for the same file', () => {
    if (!resultHashFile) throw new Error('resultHashFile is undefined');
    return chai.request(app)
      .post('/api')
      .attach('file', fs.readFileSync(testFilePath), 'test-file.jpg')
      .then((res) => {
        res.should.have.status(200);
        res.body.should.have.property('file').which.eq(resultHashFile);
      });
  });

  it('> possible to send json', () => {
    return chai.request(app)
      .post('/api')
      .send(testJSON)
      .then((res) => {
        res.should.have.status(200);
        const keys = Object.keys(res.body);
        keys.should.have.property('length').which.eq(Object.keys(testJSON).length);

        resultHashJSON = {};
        keys.forEach((key) => {
          res.body[key].should.be.a('string');
          res.body[key].should.have.property('length').which.gt(MIN_HASH_LEN);
          if (key !== 'page') resultHashJSON[key] = res.body[key];
        });
      });
  });

  it('> possible to send form (hashes should be the same as for testJSON except "page" field)', () => {
    if (!resultHashJSON) throw new Error('resultHashJSON is undefined');
    let formRequest = chai.request(app).post('/api');
    Object.keys(testJSON).forEach((key) => {
      formRequest = formRequest.field(key, testJSON[key]);
    });
    return formRequest
      .then((res) => {
        res.should.have.status(200);
        const keys = Object.keys(res.body);
        keys.should.have.property('length').which.eq(Object.keys(testJSON).length);

        keys.forEach((key) => {
          res.body[key].should.be.a('string');
          if (key !== 'page') {
            res.body[key].should.be.eq(resultHashJSON[key]);
          } else {
            res.body[key].should.have.property('length').which.gt(MIN_HASH_LEN);
          }
        });
      });
  });

  it('> possible to send file AND json (hashes should be the same except "page" field)', () => {
    if (!resultHashFile) throw new Error('resultHashFile is undefined');
    if (!resultHashJSON) throw new Error('resultHashJSON is undefined');

    let formRequest = chai.request(app).post('/api');
    Object.keys(testJSON).forEach((key) => {
      formRequest = formRequest.field(key, testJSON[key]);
    });
    formRequest.attach('file', fs.readFileSync(testFilePath), 'test-file.jpg');

    return formRequest
      .then((res) => {
        res.should.have.status(200);
        const keys = Object.keys(res.body);
        keys.should.have.property('length').which.eq(Object.keys(testJSON).length + 1); // +1 for "file"

        keys.forEach((key) => {
          res.body[key].should.be.a('string');
          if (key !== 'page' && key !== 'file') {
            res.body[key].should.be.eq(resultHashJSON[key]);
          } else {
            res.body[key].should.have.property('length').which.gt(MIN_HASH_LEN);
          }
        });

        res.body.should.have.property('file').which.eq(resultHashFile);
      });
  });

  it('> should responds with 404 for incorrect links', () => {
    return chai.request(app)
      .post('/api')
      .send({
        wrong: "this is a totally incorrect link.com"
      })
      .then((res) => new Error(`expected 404, got res:${res}`))
      .catch((err) => {
        err.should.have.status(404);
      });
  });
});
