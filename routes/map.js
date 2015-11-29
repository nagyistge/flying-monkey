var gpsDB = require('./gpsDB');
var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  var gpsCoord = gpsDB.getGPSCoord();
  var features = {
    "type": "FeatureCollection",
    "features": [{
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [ gpsCoord.long, gpsCoord.lat ] },
      "properties": {}
    }]
  }

  res.render('map', { features:JSON.stringify(features), frameCenterLat:gpsCoord.lat, frameCenterLong:gpsCoord.long });
});

module.exports = router;
