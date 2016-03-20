"use strict";

const express = require('express');
const gpsDB = require('../gpsDB');
const Promise = require('bluebird')
const numerics = require('../numerics');

let router = express.Router();
let serialTable = {};

function checkSerial(id,serial)
{
  if(serial != null)
  {
    if(serialTable.hasOwnProperty(id) && serialTable[id] > serial) return false;
    serialTable[id] = serial;
  }
  else if(serialTable.hasOwnProperty(id)) return false;
  return true;
}

const addOrientation = Promise.coroutine(function *(homeState,from)
{
  homeState.azmuth = yield numerics.forwardAzmuth(from.lat,from.long,homeState.lat,homeState.long);
  homeState.distance = yield numerics.haversine(from.lat,from.long,homeState.lat,homeState.long);
})

router.post('/', function(req, res, next)
{
  if(req.body.device != null
    && req.body.date != null
    && req.body.lat != null
    && req.body.long != null
    && req.body.alt != null
  )
  {
    let device;
    let millis;
    let lat;
    let long;
    let alt;
    let serial = null;

    if(typeof req.body.device == "string") device = JSON.parse(req.body.device);
    else device = req.body.device;
    if(typeof req.body.date == "string") millis = parseInt(req.body.date);
    else millis = req.body.date;
    if(typeof req.body.lat == "string") lat = parseFloat(req.body.lat);
    else lat = req.body.lat;
    if(typeof req.body.long == "string") long = parseFloat(req.body.long);
    else long = req.body.long;
    if(typeof req.body.lat == "string") alt = parseFloat(req.body.alt);
    else alt = req.body.alt;
    if(req.body.serial != null)
    {
      if(typeof req.body.serial == "string") serial = parseInt(req.body.serial);
      else serial = req.body.serial;
    }

    if(device.deviceId && device.deviceName && checkSerial(device.deviceId,serial))
      gpsDB.addGPSCoord(device.deviceId,device.deviceName,millis,lat,long,alt);

    let home = gpsDB.getLoc("*");

    if(home != null && home.src != null)
    {
      let homeState;

      if(home.src.current != null)
      {
        homeState =
        {
          lat:home.src.current.lat,
          long:home.src.current.long,
          alt:home.src.current.alt
        };
      }
      else
      {
        homeState =
        {
          lat:home.src.latitude0,
          long:home.src.longitude0,
          alt:home.src.altitude0
        };

      }
      addOrientation(homeState,{ lat:lat, long:long });
      res.json({ home:homeState });
    }
    else res.json('{}');
  }
  else res.json('{}');
});

router.post('/reset',function(req,res,next)
{
  if(req.body.deviceId != null)
  {
    delete serialTable[req.body.deviceId]
    res.status(200).send('OK');
  }
  else next();
});

module.exports = router;
