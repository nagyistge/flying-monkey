"use strict";

const gpsDB = require('../gpsDB');
const Promise = require('bluebird');
const threeDR = require('../3DR');
const numerics = require('../numerics');

let parallel = null;
let reference = null;
let home = null;
let isTracking = false;

gpsDB.update('*',Promise.coroutine(function *(gpsObj,prev)
{
  home = gpsObj;


  if(isTracking)
  {
    let target = threeDR.getLoc("x");
  }
}));

const setVelocity = Promise.coroutine(function *(from,to)
{
  if(target && target.src.current && threeDR.isArmed())
  {
    let forwardAzmuth = yield numerics.forwardAzmuth(from.lat,from.long,to.lat,to.long);
    let distance = yield numerics.haversine(from.lat,from.long,to.lat,to.long);
    let speed = (distance*distance)/9;

    if(distance <= 2) speed = 1;
    if(speed > 5) speed = 5;

    let vx = Math.cos(forwardAzmuth)*speed;
    let vy = Math.sin(forwardAzmuth)*speed;
    let modeName = threeDR.modeName();

    if(modeName != "RTL")
    {
      if(modeName != "GUIDED")
      {
        threeDR.guided();
        yield threeDR.waitForMode("GUIDED");
      }
      console.log("setVelocity: " + `${vx} ${vy} ${0}`);
      threeDR.setVelocity(vx,vy,0);
    }
});

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
      let translated =
      {
        lat:gpsObj.src.current.lat + reference.vector[0],
        long:gpsObj.src.current.long + reference.vector[1],
        alt:gpsObj.src.current.alt + reference.vector[2]
      };

      gpsDB.addGPSCoord("x","target",now.valueOf(),translated.lat,translated.long,translated.alt);
      if(isTracking) yield setVelocity(home.src.current,translated);
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
  parallel: function(id)
  {
    if(parallel != id)
    {
      parallel = id;
      reference = null;
      gpsDB.update(id,deviceUpdate);
    }
  },
  rtl: function() { threeDR.rtl(); },
  track: function() { isTracking = true; }
}
