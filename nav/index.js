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

gpsDB.update('*',Promise.coroutine(function *(gpsObj,prev)
{
  home = gpsObj;

  if(isTracking) yield setVelocity();
}));

const setVelocity = Promise.coroutine(function *()
{
  let target = gpsDB.getLoc('x');

  if(target && target.src.current && home && home.src.current) // && threeDR.isArmed())
  {
    let from = home.src.current;
    let to = target.src.current;
    let forwardAzmuth = yield numerics.forwardAzmuth(from.lat,from.long,to.lat,to.long);
    let distance = yield numerics.haversine(from.lat,from.long,to.lat,to.long);
    let speed = (distance*distance)/9;

    if(distance <= 2 && speed > 1) speed = 1;
    if(speed > 2) speed = 2;

    let vn = Math.cos(forwardAzmuth)*speed;
    let ve = Math.sin(forwardAzmuth)*speed;
    let modeName = threeDR.modeName();

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
  }
});

const deviceUpdate = Promise.coroutine(function *(gpsObj,prev)
{
  if(home != null && keyId == gpsObj.id)
  {
    let now = new Date();

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
      if(isTracking) yield setVelocity();
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
  goto: function() { gotoTarget(false); },
  loiter: function() { threeDR.loiter(); },
  parallel: function(id)
  {
    keyId = id;
    separationVectors[id] = null;
    gpsDB.update(id,deviceUpdate);
  },
  rtl: function() { threeDR.rtl(); },
  track: function() { isTracking = true; }
}
