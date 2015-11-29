var gpsDB = require('./gpsDB');
var express = require('express');
var router = express.Router();

router.post('/', function(req, res, next)
{
   console.log("body: ", req.body);
   if(req.body.lat != null && req.body.long != null) gpsDB.setGPSCoord(req.body.lat,req.body.long);
   next();
});

module.exports = router;
