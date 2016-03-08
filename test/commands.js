"use strict";

const request = require('request');
const Promise = require('bluebird');

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
      deviceId:id
    }
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

const archive = Promise.coroutine(function*(url,id)
{
  return yield navArchive(url,id);
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

const loiter = Promise.coroutine(function*(url)
{
  return yield navLoiter(url);
});

const parallel = Promise.coroutine(function*(url,id)
{
  return yield navParallel(url,id);
});

const rtl = Promise.coroutine(function*(url)
{
  return yield navRTL(url);
});

const send = Promise.coroutine(function*(url,id,name,lat,long,alt)
{
  let now = new Date();

  yield sendCoord(url,id,name,now.valueOf(),lat,long,alt);
});

const track = Promise.coroutine(function*(url)
{
  return yield navTrack(url);
});

module.exports =
{
  archive:archive,
  flightPath:flightPath,
  goto:goto,
  list:list,
  loiter:loiter,
  parallel:parallel,
  rtl:rtl,
  send:send,
  track:track
};
