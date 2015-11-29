var gpsDB = require('./gpsDB');
var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  var gpsCoord = gpsDB.getGPSCoord();

  res.json({ lat:gpsCoord.lat, long:gpsCoord.long });
});

module.exports = router;
