"use strict";

const gpsDB = require('../gpsDB');
const Promise = require('bluebird');
const threeDR = require('../3DR');
const numerics = require('../numerics');

let keyId = null;
let separationVectors = {};
let home = null;
let modePending = null;
let goal = { serial:0 };
let isManuvering = false;
let flightData = {};
let mTime = (new Date()).valueOf();

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

const planParallelCourse = Promise.coroutine(function *(planData)
{
  let destLat = planData.target.lat + planData.target.vLat;
  let destLong = planData.target.long + planData.target.vLong;

  if(planData.home.ve != null && planData.home.vn != null)
  {
    destLat -= 0.1*planData.home.vLat;
    destLong -= 0.1*planData.home.vLong;
  }

  let homeToFutureTargetAzmuth = yield numerics.forwardAzmuth(planData.home.lat,planData.home.long,destLat,destLong);
  let homeToFutureTargetDistance = yield numerics.haversine(planData.home.lat,planData.home.long,destLat,destLong);
  let speed = yield numerics.speed(homeToFutureTargetDistance);
  let homeToKeyAzmuth = yield numerics.forwardAzmuth(planData.home.lat,planData.home.long,planData.key.lat,planData.key.long);

  if(homeToFutureTargetAzmuth < 0) homeToFutureTargetAzmuth += 2*Math.PI;
  if(homeToKeyAzmuth < 0) homeToKeyAzmuth += 2*Math.PI;

  let yaw = homeToKeyAzmuth*180/Math.PI;
  let vn = Math.cos(homeToFutureTargetAzmuth)*speed;
  let ve = Math.sin(homeToFutureTargetAzmuth)*speed;
  let res;

  console.log(`yaw = ${yaw} vn = ${vn} ve = ${ve}`);

  if(speed > 0.15 || planData.home.speed > 0.15)
  {
    threeDR.setVelocity(vn,ve,0);
    threeDR.setYaw(yaw);
  }
  else threeDR.setYaw(yaw);
});

const manuver = Promise.coroutine(function *()
{
  let modeName = threeDR.modeName();

  if(modeName != 'RTL' && isManuvering && goal.serial >= 1 && modePending  == null && threeDR.isArmed())
  {
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

    if(goal.plan == "parallel")
    {
      mTime = (new Date()).valueOf();

      let homeState = goal.home;
      let targetState = goal.target;
      let keyState = goal.key;
      let latencyFactor = (mTime - goal.millis)/1000;
      let homeUpdated = yield numerics.destination(homeState.lat,homeState.long,homeState.azmuth,homeState.speed*latencyFactor);
      let targetUpdated = yield numerics.destination(targetState.lat,targetState.long,targetState.azmuth,homeState.speed*latencyFactor);
      let keyUpdated = yield numerics.destination(keyState.lat,keyState.long,homeState.azmuth,keyState.speed*latencyFactor);

      let planData =
      {
        home:
        {
          lat:homeUpdated[0],
          long:homeUpdated[1],
          alt:homeState.alt,
          vLat:homeState.vLat,
          vLong:homeState.vLong,
          vAlt:homeState.vAlt,
          speed:homeState.speed,
          azmuth:homeState.asmuth
        },
        target:
        {
          lat:targetUpdated[0],
          long:targetUpdated[1],
          alt:targetState.alt,
          vLat:targetState.vLat,
          vLong:targetState.vLong,
          vAlt:targetState.vAlt,
          speed:targetState.speed,
          azmuth:targetState.azmuth
        },
        key:
        {
          lat:keyUpdated[0],
          long:keyUpdated[1],
          alt:keyState.alt,
          vLat:keyState.vLat,
          vLong:keyState.vLong,
          vAlt:keyState.vAlt,
          speed:keyState.speed,
          azmuth:keyState.azmuth
        }
      };

      yield planParallelCourse(planData);
    }
  }
  else if(!isManuvering || modeName == 'RTL')
  {
    if(goal != null && goal.plan != null) console.log(`discarding goal (${goal.plan})`);
    if(modeName == 'RTL')
    {
      isManuvering == false;
      separationVectors = {};
      keyId = null;
    }
  }
});

setInterval(manuver,200);

const doTrack = Promise.coroutine(function *()
{
  let target = gpsDB.getLoc('x');
  let key = gpsDB.getLoc(keyId);

  if(target && target.src.current && home && home.src.current && key && key.src.current)
  {
    let goalSerial = goal.serial;
    let now = new Date();
    let homeState = home.src.current;
    let targetState = target.src.current;
    let keyState = key.src.current;
    let homeSpeed = yield numerics.haversine(homeState.lat,homeState.long,homeState.lat + homeState.vLat,homeState.long + homeState.vLong);
    let targetSpeed = yield numerics.haversine(targetState.lat,targetState.long,targetState.lat + targetState.vLat,targetState.long + targetState.vLong);
    let keySpeed = yield numerics.haversine(keyState.lat,keyState.long,keyState.lat + keyState.vLat,keyState.long + keyState.vLong);
    let homeAzmuth = yield numerics.forwardAzmuth(homeState.lat,homeState.long,homeState.lat + homeState.vLat,homeState.long + homeState.vLong);
    let targetAzmuth = yield numerics.forwardAzmuth(targetState.lat,targetState.long,targetState.lat + targetState.vLat,targetState.long + targetState.vLong);
    let keyAzmuth = yield numerics.forwardAzmuth(keyState.lat,keyState.long,keyState.lat + keyState.vLat,keyState.long + keyState.vLong);

    if(goalSerial == goal.serial)
    {
      goal.serial++;
      goal.millis = now.valueOf()
      goal.home =
      {
        lat:homeState.lat,
        long:homeState.long,
        alt:homeState.alt,
        vLat:homeState.vLat,
        vLong:homeState.vLong,
        vAlt:homeState.vAlt,
        speed:homeSpeed,
        azmuth:homeAzmuth
      };
      goal.target =
      {
        lat:targetState.lat,
        long:targetState.long,
        alt:targetState.alt,
        vLat:targetState.vLat,
        vLong:targetState.vLong,
        vAlt:targetState.vAlt,
        speed:targetSpeed,
        azmuth:targetAzmuth
      };
      goal.key =
      {
        lat:keyState.lat,
        long:keyState.long,
        alt:keyState.alt,
        vLat:keyState.vLat,
        vLong:keyState.vLong,
        vAlt:keyState.vAlt,
        speed:keySpeed,
        azmuth:keyAzmuth
      };
    }
  }
});

gpsDB.addUpdate('*',Promise.coroutine(function *(gpsObj,prev)
{
  let now = new Date();

  home = gpsObj;
  recordFlightData(gpsObj,now);
  if(isManuvering) yield doTrack();
}));

const deviceUpdate = Promise.coroutine(function *(gpsObj,prev)
{
  let now = new Date();

  if(home != null && keyId == gpsObj.id)
  {
    if(separationVectors[gpsObj.id] == null)
    {
      let azmuth = yield numerics.forwardAzmuth(home.src.current.lat,home.src.current.long,gpsObj.src.current.lat,gpsObj.src.current.long);
      let distance = yield numerics.haversine(home.src.current.lat,home.src.current.long,gpsObj.src.current.lat,gpsObj.src.current.long);

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
      if(isManuvering) yield doTrack();
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
      if(track) isManuvering = true;
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
    goal.plan = "parallel";
    keyId = id;
    separationVectors[id] = null;
    gpsDB.addUpdate(id,deviceUpdate);
  },
  rtl: function() { threeDR.rtl(); },
  track: function() { isManuvering = true; },
  untrack: function() { isManuvering = false; }
}
