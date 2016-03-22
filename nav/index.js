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
let planning = true;
let previousYaw = null;
let commandIndex = 0;
let queueIndex = 0;

function recordFlightData(gpsObj,now)
{
  if(flightData[gpsObj.id] == null) flightData[gpsObj.id] = { paths:[], current:[] };

  let flight = flightData[gpsObj.id];

  flight.current.push({ lat:gpsObj.src.current.lat, long:gpsObj.src.current.long, alt:gpsObj.src.current.alt, millis:now.valueOf() });
}

function queueManuver(command)
{
  manuverCommands.push(command);
  queueIndex++;
}

const manuver = Promise.coroutine(function *()
{
  let modeName = threeDR.modeName();

  if(modeName != 'RTL' && manuverCommands.length != 0 && !manuvering && threeDR.isArmed())
  {
    manuvering = true;

    if(modeName != 'GUIDED')
    {
      if(modePending == null)
      {
        modePending = 'GUIDED';
        threeDR.guided();
        yield threeDR.waitForMode('GUIDED');
        modePending = null;
      }
    }

    if(queueIndex > commandIndex)
    {
      if(commandIndex < queueIndex - 2) commandIndex = queueIndex - 2;

      console.log("commandIndex = ",commandIndex," queueIndex = ",queueIndex);

      let command = manuverCommands[commandIndex++];

      for(let i = 0;i < command.length;i++)
      {
        if(command[i].hasOwnProperty('velocity'))
        {
           console.log(`performed set velocity (${command[i].velocity.vn},${command[i].velocity.ve})`);
           threeDR.setVelocity(command[i].velocity.vn,command[i].velocity.ve,0);
        }
        else if(command[i].hasOwnProperty('yaw')) threeDR.setYaw(command[i].yaw.yawAngle);
      }
    }
    manuvering = false;
  }
  else if(!manuvering && (manuverCommands.length != 0 || modeName == 'RTL'))
  {
     if(manuverCommands.length != 0) console.log("discarded command:");
     if(modeName == 'RTL')
     {
       isTracking == false;
       separationVectors = {};
       keyId = null;
     }
     manuverCommands = [];
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

  if(target && target.src.current && home && home.src.current && key && key.src.current)// && planning)
  {
    let homeState = home.src.current;
    let targetState = target.src.current;
    let keyState = key.src.current;

    let homeToTargetAzmuth = yield numerics.forwardAzmuth(homeState.lat,homeState.long,targetState.lat,targetState.long);
    let homeToKeyAzmuth = yield numerics.forwardAzmuth(homeState.lat,homeState.long,keyState.lat,keyState.long);
    let homeToTargetDistance = yield numerics.haversine(homeState.lat,homeState.long,targetState.lat,targetState.long);
    let targetSpeed = yield numerics.haversine(0.0,0.0,targetState.vt,targetState.vg);
    let homeSpeed = yield numerics.haversine(0.0,0.0,homeState.vt,homeState.vg);
    let targetDirection = yield numerics.forwardAzmuth(0.0,0.0,targetState.vt,targetState.vg);

    let homeToFutureTargetAzmuth;
    let homeToFutureTargetDistance;
    if(homeState.vt != null && homeState.vg != null)
    {
      homeToFutureTargetAzmuth = yield numerics.forwardAzmuth(homeState.lat,homeState.long,targetState.lat + targetState.vt - 0*homeState.vt,targetState.long + 2*targetState.vg - 0*homeState.vg);
      homeToFutureTargetDistance = yield numerics.haversine(homeState.lat,homeState.long,targetState.lat + targetState.vt - 0*homeState.vt,targetState.long + 2*targetState.vg - 0*homeState.vg);
    }
    else
    {
      homeToFutureTargetAzmuth = yield numerics.forwardAzmuth(homeState.lat,homeState.long,targetState.lat + 2*targetState.vt,targetState.long + 2*targetState.vg);
      homeToFutureTargetDistance = yield numerics.haversine(homeState.lat,homeState.long,targetState.lat + 2*targetState.vt,targetState.long + 2*targetState.vg);
    }

    //let distance = homeToTargetDistance;
    let distance = homeToFutureTargetDistance;
    let speed = distance/3;

    if(distance <= 10) speed /= 2;
    if(speed > 5) speed = 5;
    if(homeToTargetAzmuth < 0) homeToTargetAzmuth += 2*Math.PI;
    if(homeToFutureTargetAzmuth < 0) homeToFutureTargetAzmuth += 2*Math.PI;
    if(homeToKeyAzmuth < 0) homeToKeyAzmuth += 2*Math.PI;

    //let azmuth = homeToTargetAzmuth;
    let azmuth = homeToFutureTargetAzmuth;

    let yaw = homeToKeyAzmuth*180/Math.PI;
    let vn = Math.cos(azmuth)*speed;
    let ve = Math.sin(azmuth)*speed;
    let res;

    let tazmuth = homeToTargetAzmuth*180/Math.PI;
    let fazmuth = homeToFutureTargetAzmuth*180/Math.PI;

    console.log(`tdistance = ${homeToTargetDistance} fdistance = ${distance} speed = ${speed} homeSpeed = ${homeSpeed}`)
    console.log(`yaw = ${yaw} tazmuth = ${tazmuth} fazmuth = ${fazmuth}`);
    console.log(`yaw = ${yaw} vn = ${vn} ve = ${ve}`);

    //res = [ { velocity:{ vn:vn, ve:ve }}, { yaw:{ yawAngle:yaw }} ];

    if(speed > 0.3 || homeSpeed > 0.3) res = [ { velocity:{ vn:vn, ve:ve }} ];
    else
    {
/*
      let yawDuration = 2000;

      if(previousYaw != null)
      {
        let yawDifference = yaw - previousYaw;

        if(yawDifference < -180) yawDifference = abs(yawDifference + 180);
        if(yawDifference > 180) yawDifference = abs(yawDifference - 180);
        previousYaw = yaw;
        yawDuration = yawDuration/180*2000;
      }

      console.log("Yaw duration = ",yawDuration);
      setTimeout(function() { planning = true; },yawDuration);
      planning = false;
*/
      res = [ { yaw:{ yawAngle:yaw }} ];
    }

    //let httDeg = homeToTargetAzmuth*180/Math.PI;
    //let tdDeg = targetDirection*180/Math.PI;

    //console.log(`homeToTargetAzmuth = ${httDeg} speed = ${homeToTargetSpeed} ---> vn = ${vn} ve = ${ve}`);
    //console.log(`Yaw = ${yaw}`);
    //console.log(`targetSpeed = ${targetSpeed} tdDeg = ${tdDeg}`);
    if(res.velocity) console.log("tracking = ",res.velocity);
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
      let azmuth = yield numerics.forwardAzmuth(gpsObj.src.current.lat,gpsObj.src.current.long,home.src.current.lat,home.src.current.long);
      let distance = yield numerics.haversine(gpsObj.src.current.lat,gpsObj.src.current.long,home.src.current.lat,home.src.current.long);

/*
      separationVectors[gpsObj.id] =
      {
        azmuth:azmuth,
        distance:distance,
        alt:home.src.current.alt - gpsObj.src.current.alt
      };
*/

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

/*
      let LL = yield numerics.destination(gpsObj.src.current.lat,gpsObj.src.current.long,separationVectors[gpsObj.id].azmuth,separationVectors[gpsObj.id].distance);

      let translated =
      {
        lat:LL[0],
        long:LL[1],
        alt:gpsObj.src.current.alt + separationVectors[gpsObj.id].alt
      };
      */

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
  azmuth: function(id,azmuth)
  {
    if(id && separationVectors[id] != null) separationVectors[id].azmuth = azmuth;
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
