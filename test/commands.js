"use strict";

const request = require('request');
const Promise = require('bluebird');

const coordReset = Promise.promisify(function(url,id,callback)
{
  request.post({
    url: url + 'log_gps/reset',
    json: true,
    body:
    {
      deviceId:id
    }
  },
  function (err,res,body) {
    callback(err,body);
  });
});

const coordSend = Promise.promisify(function(url,id,name,millis,lat,long,alt,serial,callback)
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
      alt:alt,
      serial:serial
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

const navArchive = Promise.promisify(function(url,id,callback)
{
  request.post({
    url: url + 'nav/archive',
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

const navArm = Promise.promisify(function(url,callback)
{
  request.post({
    url: url + 'nav/arm',
    json: true
  },
  function (err,res,body) {
    callback(err);
  });
});

const navFlightPath = Promise.promisify(function(url,id,num,callback)
{
  request.post({
    url: url + 'nav/getFlightPath',
    json: true,
    body:
    {
      deviceId:id,
      pathNum:num
    }
  },
  function (err,res,body) {
    callback(err,body);
  });
});

const navGoto = Promise.promisify(function(url,callback)
{
  request.post({
    url: url + 'nav/goto',
    json: true
  },
  function (err,res,body) {
    callback(err);
  });
});

const navLaunch = Promise.promisify(function(url,callback)
{
  request.post({
    url: url + 'nav/launch',
    json: true
  },
  function (err,res,body) {
    callback(err);
  });
});

const navLoiter = Promise.promisify(function(url,callback)
{
  request.post({
    url: url + 'nav/loiter',
    json: true
  },
  function (err,res,body) {
    callback(err);
  });
});

const navParallel = Promise.promisify(function(url,id,callback)
{
  request.post({
    url: url + 'nav/parallel',
    json: true,
    body:
    {
      device: { deviceId:id }
    }
  },
  function (err,res,body) {
    callback(err);
  });
});

const navRecord = Promise.promisify(function(url,callback)
{
  request.post({
    url: url + 'nav/record',
    json: true
  },
  function (err,res,body) {
    callback(err);
  });
});

const navRTL = Promise.promisify(function(url,callback)
{
  request.post({
    url: url + 'nav/rtl',
    json: true
  },
  function (err,res,body) {
    callback(err);
  });
});

const navStop = Promise.promisify(function(url,callback)
{
  request.post({
    url: url + 'nav/stop',
    json: true
  },
  function (err,res,body) {
    callback(err);
  });
});

const navTether = Promise.promisify(function(url,id,callback)
{
  request.post({
    url: url + 'nav/tether',
    json: true,
    body:
    {
      device: { deviceId:id }
    }
  },
  function (err,res,body) {
    callback(err);
  });
});

const navTrack = Promise.promisify(function(url,callback)
{
  request.post({
    url: url + 'nav/track',
    json: true
  },
  function (err,res,body) {
    callback(err);
  });
});

const navUntrack = Promise.promisify(function(url,callback)
{
  request.post({
    url: url + 'nav/untrack',
    json: true
  },
  function (err,res,body) {
    callback(err);
  });
});

const archive = Promise.coroutine(function*(url,id)
{
  return yield navArchive(url,id);
});

const arm = Promise.coroutine(function*(url)
{
  return yield navArm(url);
});

const flightPath = Promise.coroutine(function*(url,id,num)
{
  return yield navFlightPath(url,id,num);
});

const goto = Promise.coroutine(function*(url)
{
  return yield navGoto(url);
});

const list = Promise.coroutine(function*(url)
{
  return yield getList(url);
});

const launch = Promise.coroutine(function*(url)
{
  return yield navLaunch(url);
});

const loiter = Promise.coroutine(function*(url)
{
  return yield navLoiter(url);
});

const parallel = Promise.coroutine(function*(url,id)
{
  return yield navParallel(url,id);
});

const record = Promise.coroutine(function*(url)
{
  return yield navRecord(url);
});

const rtl = Promise.coroutine(function*(url)
{
  return yield navRTL(url);
});

const reset = Promise.coroutine(function*(url,id)
{
  return yield coordReset(url,id);
});

const send = Promise.coroutine(function*(url,id,name,lat,long,alt,serial)
{
  let now = new Date();

  yield coordSend(url,id,name,now.valueOf(),lat,long,alt,serial);
});

const stop = Promise.coroutine(function*(url)
{
  return yield navStop(url);
});

const tether = Promise.coroutine(function*(url,id)
{
  return yield navTether(url,id);
});

const track = Promise.coroutine(function*(url)
{
  return yield navTrack(url);
});

const untrack = Promise.coroutine(function*(url)
{
  return yield navUntrack(url);
});

module.exports =
{
  archive:archive,
  arm:arm,
  flightPath:flightPath,
  goto:goto,
  list:list,
  launch:launch,
  loiter:loiter,
  parallel:parallel,
  record:record,
  reset:reset,
  rtl:rtl,
  send:send,
  stop:stop,
  tether:tether,
  track:track,
  untrack:untrack
};
