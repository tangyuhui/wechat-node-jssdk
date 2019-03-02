'use strict';

const express = require('express');
const http = require('http');
const swig = require('swig');
const { Wechat, Payment } = require('../lib');
const path = require('path');
const debug = require('debug')('wechat-demo');
const bodyParser = require('body-parser');
const isEmpty = require('lodash.isempty');
const utils = require('../lib/utils');

const cookieParser = require('cookie-parser');
const session = require('express-session');

const wechatConfig = require('./wechat-config');


const wx = new Wechat(wechatConfig);


const app = express();
swig.setDefaults({
  cache: false,
});

app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.enable('trust proxy');
app.set('views', path.join(__dirname));

app.use(cookieParser());
app.use(
  session({
    name: 'sid',
    secret: 'wechat-app',
    saveUninitialized: true,
    resave: true,
  })
);

app.use(function(req, res, next) {
  res.locals.appId = wechatConfig.appId;
  next();
});


app.get('/get-signature', function(req, res) {
  console.log(req.query);
  wx.jssdk.getSignature(req.query.url).then(
    data => {
      console.log('OK', data);
      res.json(data);
    },
    reason => {
      console.error(reason);
      res.json(reason);
    }
  );
});

const server = http.createServer(app);
const port = process.env.PORT || 3000;
//should use like nginx to proxy the request to 3000, the signature domain must be on PORT 80.
server.listen(port);
server.on('listening', function() {
  debug('Express listening on port %d', port);
});

process.on('exit', function() {
  wx.store.flush();
});
