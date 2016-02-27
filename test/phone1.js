"use strict";

const gps = require('./gps');

function *stationary(lat,long,alt)
{
  var obj = { id:"FF0000000", name:"phone1", lat:lat, long:long, alt:alt };

  for(;;) yield obj;
}

gps.sendSeries(0,stationary(19.823061,-155.47,5199.888)).then(function() { console.log('done'); });
