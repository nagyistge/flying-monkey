"use strict";

const express = require('express');
const gpsDB = require('../gpsDB');

const router = express.Router();

router.post('/', function(req, res, next) {
  res.json({ list:gpsDB.getIdList()} );
});

module.exports = router;
