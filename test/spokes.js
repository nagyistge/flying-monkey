"use strict";

const meterLengthInDegrees = 8.546351e-6;

function genSpokes(centerLat,centerLong,r,n)
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

module.exports = function(centerLat,centerLong,spokeLength,numSpokes)
{
  return genSpokes(centerLat,centerLong,spokeLength*meterLengthInDegrees,numSpokes);
}
