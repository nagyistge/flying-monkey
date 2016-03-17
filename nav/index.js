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
let manuverCommands = [];
let manuvering = false;

function recordFlightData(gpsObj,now)
{
  if(flightData[gpsObj.id] == null) flightData[gpsObj.id] = { paths:[], current:[] };

  let flight = flightData[gpsObj.id];

  flight.current.push({ lat:gpsObj.src.current.lat, long:gpsObj.src.current.long, alt:gpsObj.src.current.alt, millis:now.valueOf() });
}

function queueManuver(command)
{
  manuverCommands.push(command);
}

const manuver = Promise.coroutine(function *()
{
  let modeName = threeDR.modeName();

  if(modeName != "RTL" && manuverCommands.length != 0 && !manuvering && threeDR.isArmed())
  {
    manuvering = true;

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

    let command = manuverCommands[manuverCommands.length - 1];

    for(let i = 0;i < command.length;i++)
    {
      if(command[i].hasOwnProperty('velocity'));// threeDR.setVelocity(command[i].velocity.vn,command[i].velocity.ve,0);
      else if(command[i].hasOwnProperty('yaw')) threeDR.setYaw(command[i].yaw.yawAngle);
    }
    manuverCommands = [];

    manuvering = false;
  }
  else if(manuverCommands.length != 0)
  {
     console.log("discarded command:");
     //console.log(JSON.stringify(manuverCommands[manuverCommands.length - 1],null,2));
  }
});

setInterval(manuver,200);

/*
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
    let targetSpeed = yield numerics.haversine(0.0,0.0,to.vt,to.vg);
    let targetDirection = yield numerics.forwardAzmuth(0.0,0.0,to.vt,to.vg);

    if(speed > 2) speed = 2;
    if(forwardAzmuth < 0) forwardAzmuth += 2*Math.PI;
    if(targetDirection < 0) targetDirection += 2*Math.PI;

    let vn = Math.cos(forwardAzmuth)*speed;
    let ve = Math.sin(forwardAzmuth)*speed;
    let azDeg = forwardAzmuth*180/Math.PI;
    let tdDeg = targetDirection*180/Math.PI;
    let modeName = threeDR.modeName();

    console.log(`azmuth = ${azDeg} dist = ${distance} speed = ${speed} ---> vn = ${vn} ve = ${ve}`);
    console.log(`targetSpeed = ${targetSpeed} tdDeg = ${tdDeg}`);

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
      else if(modePending == null) threeDR.setVelocity(vn,ve,0);
    }
  }
});

const setYaw = Promise.coroutine(function *()
{
  let target = gpsDB.getLoc(keyId);

  if(target && target.src.current && home && home.src.current)// && threeDR.isArmed())
  {
    let from = home.src.current;
    let to = target.src.current;
    let forwardAzmuth = yield numerics.forwardAzmuth(from.lat,from.long,to.lat,to.long);
    let yaw = forwardAzmuth*180/Math.PI;
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
      else if(modePanding == null) threeDR.setYaw(yaw);
    }
  }
});
*/

const trackCommand = Promise.coroutine(function *()
{
  let target = gpsDB.getLoc('x');
  let key = gpsDB.getLoc(keyId);

  if(target && target.src.current && home && home.src.current && key && key.src.current)
  {
    let homeState = home.src.current;
    let targetState = target.src.current;
    let keyState = key.src.current;

    let homeToTargetAzmuth = yield numerics.forwardAzmuth(homeState.lat,homeState.long,targetState.lat,targetState.long);
    let homeToKeyAzmuth = yield numerics.forwardAzmuth(homeState.lat,homeState.long,keyState.lat,keyState.long);
    let homeToTargetDistance = yield numerics.haversine(homeState.lat,homeState.long,targetState.lat,targetState.long);
    let targetSpeed = yield numerics.haversine(0.0,0.0,targetState.vt,targetState.vg);
    let targetDirection = yield numerics.forwardAzmuth(0.0,0.0,targetState.vt,targetState.vg);
    let homeToTargetSpeed = homeToTargetDistance/3;

    if(homeToTargetSpeed > 2) homeToTargetSpeed = 2;
    if(homeToTargetAzmuth < 0) homeToTargetAzmuth += 2*Math.PI;
    if(homeToKeyAzmuth < 0) homeToKeyAzmuth += 2*Math.PI;
    if(targetDirection < 0) targetDirection += 2*Math.PI;

    let yaw = homeToKeyAzmuth*180/Math.PI;
    let vn = Math.cos(homeToTargetAzmuth)*homeToTargetSpeed;
    let ve = Math.sin(homeToTargetAzmuth)*homeToTargetSpeed;
    let res = [ { velocity:{ vn:vn, ve:ve }}, { yaw:{ yawAngle:yaw }} ];

    let httDeg = homeToTargetAzmuth*180/Math.PI;
    let tdDeg = targetDirection*180/Math.PI;

    //console.log(`homeToTargetAzmuth = ${httDeg} speed = ${homeToTargetSpeed} ---> vn = ${vn} ve = ${ve}`);
    //console.log(`Yaw = ${yaw}`);
    //console.log(`targetSpeed = ${targetSpeed} tdDeg = ${tdDeg}`);
    return  res;
  }
  else return null;
});

const doTrackManuver = Promise.coroutine(function *()
{
  let command = yield trackCommand();

  //console.log("trackCommand:\n",JSON.stringify(command,null,2));
  if(command != null) queueManuver(command);
});

gpsDB.addUpdate('*',Promise.coroutine(function *(gpsObj,prev)
{
  let now = new Date();

  home = gpsObj;
  recordFlightData(gpsObj,now);
  if(isTracking) yield doTrackManuver();
}));

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
      if(isTracking) yield doTrackManuver();
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
    if(keyId != null) gpsDB.clearUpdates(keyId);
    keyId = id;
    separationVectors[id] = null;
    gpsDB.addUpdate(id,deviceUpdate);
  },
  rtl: function() { threeDR.rtl(); },
  track: function() { isTracking = true; },
  untrack: function() { isTracking = false; }
}
