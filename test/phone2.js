"use strict";

const Promise = require('bluebird');
const send = require('./send');

const gpsInaccuracy = 40*8.546351e-6;
const altitudeInaccuracy = 0.01;

function addNoise(x,inaccuracy)
{
  return x + Math.random()*2*inaccuracy - inaccuracy;
}

function gpsNoise(x)
{
  return addNoise(x,gpsInaccuracy);
}

function altitudeNoise(x)
{
  return addNoise(x,altitudeInaccuracy);
}

const gpsSeries = Promise.promisify(function(count,lat,long,alt,done)
{
  function sendPointInSeries()
  {
    let noise = [gpsNoise(lat),gpsNoise(long),altitudeNoise(alt)];
    let id = Math.round(Math.random()*10);


    console.log("sending: ",noise);
    send("FF00000000" + id,"phone",noise[0],noise[1],noise[2]);
    setTimeout(function()
    {
      if(--count == 0) done();
      else sendPointInSeries();
    },5);
  }

  sendPointInSeries();
});

gpsSeries(0,19.823061,-155.47,5199.888).then(function() { console.log('done'); });
