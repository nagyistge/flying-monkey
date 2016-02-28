"use strict";

const gpsDB = require('../gpsDB');
const Promise = require('bluebird');
const threeDR = require('../3DR');

let parallel = null;
let reference = null;
let home = null;

gpsDB.update('*',Promise.coroutine(function *(gpsObj,prev)
{
  home = gpsObj;
}));

const deviceUpdate = Promise.coroutine(function *(gpsObj,prev)
{
  if(home != null && parallel != null && parallel == gpsObj.id)
  {
    let now = new Date();

    if(reference == null)
    {
      console.log(home);
      reference =
      {
        src:gpsObj,
        vector:[home.src.current.lat - gpsObj.src.current.lat,home.src.current.long - gpsObj.src.current.long,home.src.current.alt - gpsObj.src.current.alt]
      };

      gpsDB.addGPSCoord("x","target",now.valueOf(),home.src.current.lat,home.src.current.long,home.src.current.alt);
    }
    else
    {
      let translatedLat = gpsObj.src.current.lat + reference.vector[0];
      let translatedLong = gpsObj.src.current.long + reference.vector[1];
      let translatedAlt = gpsObj.src.current.alt + reference.vector[2];

      gpsDB.addGPSCoord("x","target",now.valueOf(),translatedLat,translatedLong,translatedAlt);
    }
  }
});

module.exports =
{
  parallel:function(id)
  {
    if(parallel != id)
    {
      parallel = id;
      reference = null;
      gpsDB.update(id,deviceUpdate);
    }
  },
  goto: function()
  {
    if(parallel != null)
    {
       let target = gpsDB.getLoc('x');
       let home = gpsDB.getLoc('*');

       console.log("goto: " + `(${target.src.current.lat},${target.src.current.long},${home.src.current.alt})`);
       threeDR.goto(target.src.current.lat,target.src.current.long,home.src.current.alt);
    }
  }
}
