"use strict";

const gps = require('./gps');

function *multiStationary(lat,long,alt)
{
  for(;;)
  {
    let id = Math.round(Math.random()*9);

    yield { id:`FF000000${id}`, name:"phone2", lat:lat, long:long, alt:alt };
  }
}

gps.sendSeries(0,multiStationary(19.823061,-155.47,5199.888)).then(function() { console.log('done'); });
