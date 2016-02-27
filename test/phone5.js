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

    yield { id:`FF000000${id}`, name:"phone4", lat:spokes[index][0], long:spokes[index][1], alt:alt };
  }
}

commands.list("http://" + program.host + ":3000/").then(function(idList)
{
  if(idList != null && idList['*'] != null)
  {
    let current = idList['*'].current;
    let centerLat = current.lat;
    let centerLong = current.long;
    let spokes = spokeGenerator(centerLat,centerLong,75,720);
    let series = [];

    gps.sendSeries(0,rotated(0,1,spokes,current.alt));
  }
});
