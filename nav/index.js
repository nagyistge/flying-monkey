"use strict";

const gpsDB = require('../gpsDB');
const Promise = require('bluebird');
const threeDR = require('../3DR');

let parallel = null;
let reference = null;
let home = null;
let isTracking = false;

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
      if(isTracking) gotoTarget();
    }
  }
});

const gotoTarget = Promise.coroutine(function *(track)
{
  let target = gpsDB.getLoc('x');

  if(target && target.src.current && threeDR.isArmed())
  {
    let modeName = threeDR.modeName();

    if(modeName != "RTL")
    {
      if(modeName != "GUIDED")
      {
        threeDR.guided();
        yield threeDR.waitForMode("GUIDED");
      }
      console.log("goto: " + `(${target.src.current.lat},${target.src.current.long},${home.src.current.alt}) 2.0`);
      if(track) isTracking = true;
      threeDR.goto(target.src.current.lat,target.src.current.long,home.src.current.alt,2.0);
    }
  }
});

module.exports =
{
  parallel: function(id)
  {
    if(parallel != id)
    {
      parallel = id;
      reference = null;
      gpsDB.update(id,deviceUpdate);
    }
  },
  goto: function() { gotoTarget(false); },
  track: function() { gotoTarget(true); },
  rtl: function() { threeDR.rtl(); }
}
