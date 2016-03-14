"use strict";

const express = require('express');
const gpsDB = require('../gpsDB');

let router = express.Router();

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

    if(device.deviceId && device.deviceName)
    {
      gpsDB.addGPSCoord(device.deviceId,device.deviceName,millis,lat,long,alt);
      res.status(200).send('OK');
    }
  }
});

module.exports = router;
