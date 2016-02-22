"use strict";

const express = require('express');
const gpsDB = require('../gpsDB');

let router = express.Router();

router.post('/', function(req, res, next)
{
  if(req.body.device != null
    && req.body.device.deviceId != null
    && req.body.device.deviceName != null
    && req.body.date != null
    && req.body.lat != null
    && req.body.long != null
    && req.body.alt != null
  )
  {
    gpsDB.addGPSCoord(req.body.device.deviceId,req.body.device.deviceName,req.body.date,req.body.lat,req.body.long,req.body.alt);
    res.status(200).send('OK');
  }
});

module.exports = router;
