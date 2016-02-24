"use strict";

const Promise = require('bluebird');
const send = require('./send');

const meterLengthInDegrees = 8.546351e-6;
const gpsInaccuracy = 3*meterLengthInDegrees;
const altitudeInaccuracy = 0.01;
const centerLat = 19.823061;
const centerLong = -155.469247;
const spokeLength = 150*meterLengthInDegrees;

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

function getSpokes(centerLat,centerLong,r,n)
{
   let spokes = [];

   for(let i = 0;i < n;i++)
   {
      spokes[i] = [];
      spokes[i][0] = centerLat + r*Math.sin(2*i*Math.PI/n);
      spokes[i][1] = centerLong + r*Math.cos(2*i*Math.PI/n);
   }
   return spokes;
}

const gpsSeries = Promise.promisify(function(count,n,id,spokes,alt,done)
{
  function sendPointInSeries()
  {
    let index = Math.round(count + spokes.length/n*id) % spokes.length;
    let noise = [gpsNoise(spokes[index][0]),gpsNoise(spokes[index][1]),altitudeNoise(alt)];

    console.log("sending: ",noise);
    send("FF00000000" + id,"phone",noise[0],noise[1],noise[2]);
    setTimeout(function()
    {
      if(--count == 0) done();
      else sendPointInSeries();
    },200);
  }

  sendPointInSeries();
});

let spokes = getSpokes(centerLat,centerLong,spokeLength,360);
let series = [];

for(let i = 0;i < 10;i++) series[i] = gpsSeries(1000,10,i,spokes,5199.888);
Promise.all(series).then(function() { console.log('done'); });
