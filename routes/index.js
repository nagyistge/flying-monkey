var express = require('express');
var router = express.Router();
var DB = require('./gpsDB');
var gpsSrc = require('./collect_gps.js')(DB);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
