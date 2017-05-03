'use strict';

const express      = require('express'),
      app          = express(),
      path = require('path'),
      responseTime = require('response-time'),
      bodyParser   = require('body-parser'),
      morgan       = require('morgan'),
      jungo        = require('./src/jungo');

const port = 3000;

app.use(responseTime());
app.use(morgan('dev')); // set up logger
app.use(bodyParser.json()); // for parsing application/json

app.use(jungo); // main service routes

app.get('/*', (req, res) => {
  res.sendFile(path.resolve('./public/index.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).send(err);
});

app.listen(port, () => console.info(`Jungo server is running on ${port} port`));

module.exports = app;
