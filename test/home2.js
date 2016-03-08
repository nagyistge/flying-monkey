"use strict";

const Promise = require('bluebird');
const gps = require('./gps');
const spokeGenerator = require('./spokes');
const commands = require('./commands');
const program = require('commander');


function *rotated(id,n,spokes,alt)
{
  for(let i = 0;;i++)
  {
    let index = Math.round(i + spokes.length/n*id) % spokes.length;

    yield { id:'*', name:"solo", lat:spokes[index][0], long:spokes[index][1], alt:alt };
  }
}

let spokes = spokeGenerator(19.823061,-155.469247,75,720);
let series = [];

gps.sendSeries(0,rotated(0,1,spokes,5199.888));
