"use strict";

const express = require('express');
const nav = require('../nav');
const router = express.Router();

router.post('/goto', function(req,res,next)
{
  nav.goto();
  res.status(200).send('OK');
});

router.post('/loiter', function(req,res,next)
{
  nav.loiter();
  res.status(200).send('OK');
});

router.post('/parallel', function(req,res,next)
{
  if(req.body.deviceId != null)
  {
    nav.parallel(req.body.deviceId);
    res.status(200).send('OK');
  }
  else next();
});

router.post('/rtl', function(req,res,next)
{
  nav.rtl();
  res.status(200).send('OK');
});

router.post('/track', function(req,res,next)
{
  nav.track();
  res.status(200).send('OK');
});

module.exports = router;
