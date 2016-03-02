"use strict";

const request = require('request');
const Promise = require('bluebird');

const sendCoord = Promise.promisify(function(url,id,name,millis,lat,long,alt,callback)
{
  request.post({
    url: url + 'log_gps',
    json: true,
    body:
    {
      device: { deviceId:id, deviceName:name },
      date:millis,
      lat:lat,
      long:long,
      alt:alt
    }
  },
  function (err,res,body) {
    callback(err);
  });
});

const getList = Promise.promisify(function(url,callback)
{
  request.post({
    url: url + 'list_ids',
    json: true
  },
  function (err,res,body) {
    callback(err,body);
  });
});

const parallelNav = Promise.promisify(function(url,id,callback)
{
  request.post({
    url: url + 'nav/parallel',
    json: true,
    body:
    {
      deviceId:id
    }
  },
  function (err,res,body) {
    callback(err);
  });
});

const gotoNav = Promise.promisify(function(url,callback)
{
  request.post({
    url: url + 'nav/goto',
    json: true
  },
  function (err,res,body) {
    callback(err);
  });
});

const rtlNav = Promise.promisify(function(url,callback)
{
  request.post({
    url: url + 'nav/rtl',
    json: true
  },
  function (err,res,body) {
    callback(err);
  });
});

const trackNav = Promise.promisify(function(url,callback)
{
  request.post({
    url: url + 'nav/track',
    json: true
  },
  function (err,res,body) {
    callback(err);
  });
});

const send = Promise.coroutine(function*(url,id,name,lat,long,alt)
{
  let now = new Date();

  yield sendCoord(url,id,name,now.valueOf(),lat,long,alt);
});

const list = Promise.coroutine(function*(url)
{
  return yield getList(url);
});

const parallel = Promise.coroutine(function*(url,id)
{
  return yield parallelNav(url,id);
});

const goto = Promise.coroutine(function*(url)
{
  return yield gotoNav(url);
});

const rtl = Promise.coroutine(function*(url)
{
  return yield rtlNav(url);
});

module.exports =
{
  goto:goto,
  list:list,
  parallel:parallel,
  rtl:rtl,
  send:send,
  track:track
};
