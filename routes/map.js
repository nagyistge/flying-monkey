var express = require('express');
var gpsDB = require('../gpsDB');

var router = express.Router();

router.get('/', function(req, res, next) {
  var featureInfo = gpsDB.getFeatureInfo();
  var featureObject = { "type": "FeatureCollection", features:featureInfo.features }

  res.render('map', { featureObject:JSON.stringify(featureObject), frameCenterLat:featureInfo.center.lat, frameCenterLong:featureInfo.center.long });
});

module.exports = router;
