"use strict";

const gpsDB = require('../gpsDB');
const Promise = require('bluebird');
const threeDR = require('../3DR');
const numerics = require('../numerics');

let keyId = null;
let separationVectors = {};
let home = null;
let isTracking = false;
let modePending = null;
let flightData = {};

function recordFlightData(gpsObj,now)
{
  if(flightData[gpsObj.id] == null) flightData[gpsObj.id] = { paths:[], current:[] };

  let flight = flightData[gpsObj.id];

  flight.current.push({ lat:gpsObj.src.current.lat, long:gpsObj.src.current.long, alt:gpsObj.src.current.alt, millis:now.valueOf() });
}

gpsDB.update('*',Promise.coroutine(function *(gpsObj,prev)
{
  let now = new Date();

  home = gpsObj;
  recordFlightData(gpsObj,now);
  if(isTracking)
  {
    yield setVelocity();
    yield setYaw();
  }
}));

const setVelocity = Promise.coroutine(function *()
{
  let target = gpsDB.getLoc('x');

  if(target && target.src.current && home && home.src.current)// && threeDR.isArmed())
  {
    let from = home.src.current;
    let to = target.src.current;
    let forwardAzmuth = yield numerics.forwardAzmuth(from.lat,from.long,to.lat,to.long);
    let distance = yield numerics.haversine(from.lat,from.long,to.lat,to.long);
    let speed = distance/2;
    let tspeed = yield numerics.haversine(0.0,0.0,to.vlat,to.vlong);
    let tdir = yield numerics.forwardAzmuth(0.0,0.0,to.vlat,to.vlong);
    let tvn = Math.cos(tdir)*tspeed;
    let tve = Math.sin(tdir)*tspeed;

    console.log(`tspeed = ${tspeed} tdir = ${tdir} tvn = ${tvn} tve = ${tve}`);

    forwardAzmuth = -1.0*forwardAzmuth;

    if(speed > 8) speed = 8;

    let vn = Math.cos(forwardAzmuth)*speed;
    let ve = Math.sin(forwardAzmuth)*speed;
    let modeName = threeDR.modeName();

/*
    console.log(`fAz = ${forwardAzmuth} dist = ${distance} speed = ${speed} ---> vn = ${vn} ve = ${ve}`);
    if(modeName != "RTL")
    {
      if(modeName != "GUIDED")
      {
        if(modePending == null)
        {
          modePending = 'GUIDED';
          threeDR.guided();
          yield threeDR.waitForMode("GUIDED");
          modePending = null;
        }
      }
      else threeDR.setVelocity(vn,ve,0);
    }
  */
  }
});

const setYaw = Promise.coroutine(function *()
{
  let target = gpsDB.getLoc(keyId);

  if(target && target.src.current && home && home.src.current && threeDR.isArmed())
  {
    let from = home.src.current;
    let to = target.src.current;
    let forwardAzmuth = yield numerics.forwardAzmuth(from.lat,from.long,to.lat,to.long);
    let yaw = -1.0*forwardAzmuth/(2*Math.PI)*360;
    let modeName = threeDR.modeName();

    if(yaw < 0) yaw = yaw + 360;
    console.log(`fAz = ${forwardAzmuth} Yaw = ${yaw}`);
    if(modeName != "RTL")
    {
      if(modeName != "GUIDED")
      {
        if(modePending == null)
        {
          modePending = 'GUIDED';
          threeDR.guided();
          yield threeDR.waitForMode("GUIDED");
          modePending = null;
        }
      }
      else threeDR.setYaw(yaw);
    }
  }
});

const deviceUpdate = Promise.coroutine(function *(gpsObj,prev)
{
  let now = new Date();

  if(home != null && keyId == gpsObj.id)
  {
    if(separationVectors[gpsObj.id] == null)
    {
      separationVectors[gpsObj.id] =
      {
        vector:[home.src.current.lat - gpsObj.src.current.lat,home.src.current.long - gpsObj.src.current.long,home.src.current.alt - gpsObj.src.current.alt]
      };

      gpsDB.addGPSCoord("x","target",now.valueOf(),home.src.current.lat,home.src.current.long,home.src.current.alt);
    }
    else
    {
      let translated =
      {
        lat:gpsObj.src.current.lat + separationVectors[gpsObj.id].vector[0],
        long:gpsObj.src.current.long + separationVectors[gpsObj.id].vector[1],
        alt:gpsObj.src.current.alt + separationVectors[gpsObj.id].vector[2]
      };

      gpsDB.addGPSCoord("x","target",now.valueOf(),translated.lat,translated.long,translated.alt);
      if(isTracking)
      {
        yield setVelocity();
        yield setYaw();
      }
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
  archive: function(id)
  {
    if(id != null && flightData[id] != null && flightData[id].current.length != 0)
    {
      flightData[id].paths.push({ path:flightData[id].current });
      flightData[id].current = [];
    }
  },
  getFlightPaths: function(id)
  {
    if(flightData[id] != null) return flightData[id];
    return null;
  },
  goto: function() { gotoTarget(false); },
  loiter: function() { threeDR.loiter(); },
  parallel: function(id)
  {
    keyId = id;
    separationVectors[id] = null;
    gpsDB.update(id,deviceUpdate);
  },
  rtl: function() { threeDR.rtl(); },
  track: function() { isTracking = true; },
  untrack: function() { isTracking = false; }
}
