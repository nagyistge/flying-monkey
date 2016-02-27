"use strict";

const Promise = require('bluebird');
const gps = require('./gps');
const spokeGenerator = require('./spokes');

const centerLat = 19.823061;
const centerLong = -155.469247;

function *rotated(id,n,spokes,alt)
{
  for(let i = 0;;i++)
  {
    let index = Math.round(i + spokes.length/n*id) % spokes.length;

    yield { id:`FF000000${id}`, name:"phone4", lat:spokes[index][0], long:spokes[index][1], alt:alt };
  }
}

let spokes = spokeGenerator(centerLat,centerLong,75,360);
let series = [];

for(let i = 0;i < 10;i++) series[i] = gps.sendSeries(0,rotated(i,10,spokes,5199.888));
Promise.all(series).then(function() { console.log('done'); });
