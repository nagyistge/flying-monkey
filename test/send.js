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

const send = Promise.coroutine(function*(id,name,lat,long,alt)
{
  let now = new Date();

  yield sendCoord("http://localhost:3000/",id,name,now.valueOf(),lat,long,alt);
});

module.exports = send
