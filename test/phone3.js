"use strict";

const Promise = require('bluebird');
const gps = require('./gps');
const spokeGenerator = require('./spokes');

const centerLat = 19.823061;
const centerLong = -155.469247;

function *stationary(id,lat,long,alt)
{
  let obj = { id:`FF000000${id}`, name:"phone3", lat:lat, long:long, alt:alt };

  for(;;) yield obj;
}

let spokes = spokeGenerator(centerLat,centerLong,50,10);
let series = [];

for(let i = 0;i < 10;i++) series[i] = gps.sendSeries(0,stationary(i,spokes[i][0],spokes[i][1],5199.888));
Promise.all(series).then(function() { console.log('done'); });
