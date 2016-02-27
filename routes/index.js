var express = require('express');
var DB = require('../gpsDB');

var router = express.Router();
var localGPS = require('../3DR');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
