var express = require('express');
var gpsDB = require('../gpsDB');

var router = express.Router();

router.get('/', function(req, res, next) {
  res.json(gpsDB.getFeatureInfo());
});

module.exports = router;
