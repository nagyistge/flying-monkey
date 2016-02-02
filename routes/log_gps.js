var express = require('express');
var gpsDB = require('../gpsDB');

var router = express.Router();

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
     res.send("Recorded");
   }
});

module.exports = router;
