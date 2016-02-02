var express = require('express');
var DB = require('../gpsDB');

var router = express.Router();
var gpsSrc = require('./collect_gps.js')(DB);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
