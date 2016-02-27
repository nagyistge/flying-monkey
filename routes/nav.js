"use strict";

const express = require('express');
const nav = require('../nav');
const router = express.Router();

router.post('/parallel', function(req,res,next)
{
  console.log("body = ",req.body);
  if(req.body.deviceId != null)
  {
    nav.parallel(req.body.deviceId);
    res.status(200).send('OK');
  }
  else next();
});

module.exports = router;
