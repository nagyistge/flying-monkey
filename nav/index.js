"use strict";

const gpsDB = require('../gpsDB');
const Promise = require('bluebird');
const threeDR = require('../3DR');
const numerics = require('../numerics')();

let keyId = null;
let nextPlanId = null;
let maxExecutedPlanId = null;
let separationVectors = {};
let home = null;
let modePending = null;
let goal = { serial:0 };
let isManuvering = false;
let isRecording = false;
let flightData = {};
let mTime = (new Date()).valueOf();
let homeLocation = null;
let targetGimbalPitch = null;
let targetROI = null;
let targetYaw = null;
let checkingYaw = false;
let checkYawCount = 0;
let targetVelocity = null;
let obtainingHomeLocation = false;

function recordFlightData(gpsObj,now)
{
  if(flightData[gpsObj.id] == null) flightData[gpsObj.id] = { paths:[], current:[] };

  let flight = flightData[gpsObj.id];

  flight.current.push({ lat:gpsObj.src.current.lat, long:gpsObj.src.current.long, alt:gpsObj.src.current.alt, millis:now.valueOf() });
}

function rotateGimbal(keyDistance,alt)
{
  if(alt == null) return;
  if(homeLocation == null) homeLocation = threeDR.getHomeLocation();
  if(homeLocation == null)
  {
    console.log("homeLocation is null");
    return;
  }
   
  let pitch = Math.atan2(keyDistance,alt - homeLocation.alt)*180/Math.PI - 90;

  if(targetGimbalPitch == null) targetGimbalPitch = pitch;
  else
  {
    let gimbalPitchDiff = Math.abs(targetGimbalPitch - pitch);

    if(gimbalPitchDiff < 5)
    {
      console.log("rejecting pitch (too similar)",gimbalPitchDiff);
      return;
    }
    targetGimbalPitch = pitch;
  }
  console.log("rotating pitch = ",pitch);
  threeDR.rotateGimbal(pitch);
}

function setROI(currentLocation,newROI)
{
  if(newROI == null || isNaN(newROI.lat) || isNaN(newROI.long) || isNaN(newROI.alt)) return false;
  if(targetROI == null)
  {
    targetROI = newROI;
    threeDR.setROI(newROI.lat,newROI.long,newROI.alt);
    return true;
  }

/*
  let a = numerics.haversine(targetROI.lat,targetROI.long,newROI.lat,newROI.long);
  let b = numerics.haversine(currentLocation.lat,currentLocation.long,targetROI.lat,targetROI.long);
  let c = numerics.haversine(currentLocation.lat,currentLocation.long,newROI.lat,newROI.long);
  let theta = Math.acos(((b*b + c*c) - a*a)/(2*b*c))*180/Math.PI;
*/

  let r1 = numerics.haversine(currentLocation.lat,currentLocation.long,targetROI.lat,targetROI.long);
  let r2 = numerics.haversine(currentLocation.lat,currentLocation.long,newROI.lat,newROI.long);
  let alpha = (Math.PI/2 - numerics.forwardAzmuth(currentLocation.lat,currentLocation.long,targetROI.lat,targetROI.long) + 2*Math.PI) % (2%Math.PI);
  let beta = (Math.PI/2 - numerics.forwardAzmuth(currentLocation.lat,currentLocation.long,newROI.lat,newROI.long) + 2*Math.PI) % (2%Math.PI);
  let x1 = r1*Math.cos(alpha);
  let x2 = r2*Math.cos(beta);
  let y1 = r1*Math.sin(alpha);
  let y2 = r2*Math.sin(beta);
  let z1 = targetROI.alt;
  let z2 = newROI.alt;
  let theta = Math.acos((x1*x2 + y1*y2 + z1*z2)/(Math.sqrt(x1*x1 + y1*y1 + z1*z1)*Math.sqrt(x2*x2 + y2*y2 + z2*z2)))*180/Math.PI;

console.log("theta = ",theta);

  if(theta < 5) return false;
  targetROI = newROI
  threeDR.setROI(newROI.lat,newROI.long,newROI.alt);
  return true;
}

function setVelocity(newVelocity)
{
  if(newVelocity == null || isNaN(newVelocity.vn) || isNaN(newVelocity.ve) || isNaN(newVelocity.vd)) return;
  if(targetVelocity == null)
  {
    targetVelocity = newVelocity;
    threeDR.setVelocity(newVelocity.vn,newVelocity.ve,newVelocity.vd);
  }

  let similarity = numerics.compareVelocity(newVelocity,targetVelocity);

  if(similarity == null) return;
  if(similarity >= 0.9992) return;
  targetVelocity = newVelocity;
  threeDR.setVelocity(newVelocity.vn,newVelocity.ve,newVelocity.vd);
}

function setYaw(newYaw)
{
  if(newYaw == null || isNaN(targetYaw)) return false;
  if(targetYaw == null)
  {
    targetYaw = newYaw;
    threeDR.setYaw(newYaw);
    return newYaw;
  }

  let similarity = Math.cos((targetYaw - newYaw)/180*Math.PI);

  if(similarity >= 0.99) return targetYaw;

  let currentAttitude = threeDR.getAttitude();

console.log("currentAttitude.yaw = ",currentAttitude.yaw);

/*
  similarity = Math.cos(targetYaw/180*Math.PI - currentAttitude.yaw);
  if(similarity < 0.9985) return currentAttitude.yaw*180/Math.PI;
*/
  targetYaw = newYaw;
  threeDR.setYaw(newYaw);
  return newYaw;
}

const planParallelCourse = Promise.coroutine(function *(planData)
{
  let destLat = planData.target.lat;
  let destLong = planData.target.long;


  if(!isNaN(planData.target.vLat) && !isNaN(planData.target.vLong))
  {
    destLat += 2.5*planData.target.vLat;
    destLong += 2.5*planData.target.vLong;
  }
  else console.log("target velocity is NaN");

  if(planData.home.vLat != null && planData.home.vLong != null)
  {
    destLat -= 0.25*planData.home.vLat;
    destLong -= 0.25*planData.home.vLong;
  }

  let homeToFutureTargetAzmuth = numerics.forwardAzmuth(planData.home.lat,planData.home.long,destLat,destLong);
  let homeToFutureTargetDistance = numerics.haversine(planData.home.lat,planData.home.long,destLat,destLong);
  let speed = numerics.speed(homeToFutureTargetDistance);
  let homeToKeyAzmuth = numerics.forwardAzmuth(planData.home.lat,planData.home.long,planData.key.lat,planData.key.long);
  let homeToKeyDistance = numerics.haversine(planData.home.lat,planData.home.long,planData.key.lat,planData.key.long);

  console.log(homeToFutureTargetAzmuth,homeToFutureTargetDistance,speed,homeToKeyAzmuth,homeToKeyDistance);

  if(homeToFutureTargetAzmuth < 0) homeToFutureTargetAzmuth += 2*Math.PI;
  if(homeToKeyAzmuth < 0) homeToKeyAzmuth += 2*Math.PI;

  let yaw = homeToKeyAzmuth*180/Math.PI;
  let vn = Math.cos(homeToFutureTargetAzmuth)*speed*0.8;
  let ve = Math.sin(homeToFutureTargetAzmuth)*speed*0.8;
  let res;

  console.log(`yaw = ${yaw} vn = ${vn} ve = ${ve}`);

  setVelocity({ vn:vn, ve:ve, vd:0 });
  setYaw(yaw);
  rotateGimbal(homeToKeyDistance,planData.home.alt);
});

const planTetheredCourse = Promise.coroutine(function *(planData)
{
  let keyToHomeAzmuth = numerics.forwardAzmuth(planData.key.lat,planData.key.long,planData.home.lat,planData.home.long);
  let r = numerics.haversine(planData.key.lat,planData.key.long,planData.home.lat,planData.home.long);
  let s = planData.key.speed;
  let keyToHomeAngle = Math.PI/2 - keyToHomeAzmuth;
  let keyAngle = Math.PI/2 - planData.key.azmuth;
  let deltaF = numerics.maelstorm(r,keyToHomeAngle,s,keyAngle);
  let ve = -deltaF[0];
  let vn = -deltaF[1];
  let futureKeyLat = planData.key.lat;
  let futureKeyLong = planData.key.long;

  if(!isNaN(planData.key.vLat) && !isNaN(planData.key.vLong))
  { 
    futureKeyLat += 1.5*planData.key.vLat;
    futureKeyLong += 1.5*planData.key.vLong;
  }

/*
  let homeToFutureKeyAzmuth = yield numerics.forwardAzmuth(planData.home.lat,planData.home.long,futureKeyLat,futureKeyLong);
  let homeToFutureKeyDistance = yield numerics.haversine(planData.home.lat,planData.home.long,futureKeyLat,futureKeyLong);

  if(homeToFutureKeyAzmuth < 0) homeToFutureKeyAzmuth += 2*Math.PI;

  let yaw = homeToFutureKeyAzmuth*180/Math.PI + 10;
*/

  let homeToKeyAzmuth = numerics.forwardAzmuth(planData.home.lat,planData.home.long,planData.key.lat,planData.key.long);
  let homeToKeyDistance = numerics.haversine(planData.home.lat,planData.home.long,planData.key.lat,planData.key.long);
  let yaw = homeToKeyAzmuth*180/Math.PI;

  if(yaw > 360) yaw -= 360;
  else if(yaw < 0) yaw += 360;

  if(maxExecutedPlanId == null || planData.planId > maxExecutedPlanId)
  {
    let roiLat = planData.key.lat;
    let roiLong = planData.key.long;
    let roiAlt = planData.key.alt;

    maxExecutedPlanId = planData.planId;
    setVelocity({ vn:vn, ve:ve, vd:0 });
    if(homeLocation == null) homeLocation = threeDR.getHomeLocation();
    if(homeLocation != null && homeLocation.alt != null && !isNaN(homeLocation.alt)) roiAlt = homeLocation.alt;

    if(!isNaN(futureKeyLat) && !isNaN(futureKeyLong))
    {
       roiLat = futureKeyLat;
       roiLong = futureKeyLong;
    }

    let didSetROI = setROI(planData.home,{ lat:roiLat, long:roiLong, alt:0 })
  
    //if(didSetROI) gpsDB.addGPSCoord("^","goal",planData.key.lat,planData.key.long,roiAlt);
  
    //rotateGimbal(r,planData.home.alt);
/*
    let resYaw = setYaw(yaw);


    if(typeof resYaw  == "number")
    {
      let now = new Date();
      let LL = numerics.destination(planData.home.lat,planData.home.long,resYaw*Math.PI/180,homeToKeyDistance);

      gpsDB.addGPSCoord("^","goal",now.valueOf(),LL[0],LL[1],planData.home.alt);
    }
*/
  }
});

const assemblePlanData = Promise.coroutine(function *(planId)
{
  mTime = (new Date()).valueOf();

  let homeState = goal.home;
  let targetState = goal.target;
  let keyState = goal.key;
  let latencyFactor = (mTime - goal.millis)/1000;
  let srcLost = false;
  let homeUpdated = [0,0];
  let keyUpdated = [0,0];
  let targetUpdated = [0,0];

  if(latencyFactor > 1) latencyFactor = 1;
  if(!srcLost)
  {
    homeUpdated = numerics.destination(homeState.lat,homeState.long,homeState.azmuth,homeState.speed*latencyFactor);
    keyUpdated = numerics.destination(keyState.lat,keyState.long,keyState.azmuth,keyState.speed*latencyFactor);
    if(targetState != null) targetUpdated = numerics.destination(targetState.lat,targetState.long,targetState.azmuth,targetState.speed*latencyFactor);
  }

  //console.log(`latencyFactor = ${latencyFactor} compensation: hs = ${homeState.speed*latencyFactor} ts = ${targetState.speed*latencyFactor} ks = ${keyState.speed*latencyFactor}`)

  let planData =
  {
    planId:planId,
    home:
    {
      lat:homeUpdated[0],
      long:homeUpdated[1],
      alt:homeState.alt,
      vLat:homeState.vLat,
      vLong:homeState.vLong,
      vAlt:homeState.vAlt,
      speed:srcLost?0:homeState.speed,
      azmuth:homeState.asmuth
    },
    key:
    {
      lat:keyUpdated[0],
      long:keyUpdated[1],
      alt:keyState.alt,
      vLat:keyState.vLat,
      vLong:keyState.vLong,
      vAlt:keyState.vAlt,
      speed:srcLost?0:keyState.speed,
      azmuth:keyState.azmuth
    }
  };

  if(targetState != null)
  {
    planData.target =
    {
      lat:targetUpdated[0],
      long:targetUpdated[1],
      alt:targetState.alt,
      vLat:targetState.vLat,
      vLong:targetState.vLong,
      vAlt:targetState.vAlt,
      speed:srcLost?0:targetState.speed,
      azmuth:targetState.azmuth
    }
  }
  return planData;
});

const manuver = Promise.coroutine(function *()
{
  let modeName = threeDR.modeName();

  if(threeDR.isConnected() == null) return;
  if(goal.plan == "stop")
  {
    console.log("stopping....");
    if(modeName == 'GUIDED') threeDR.setVelocity(0,0,0);
    if(modeName != 'LOITER') threeDR.loiter();
    isManuvering = false;
  }
  else if(isManuvering && goal.serial >= 1 && (!threeDR.isConnected() || (modeName != 'RTL' &&  modePending  == null && threeDR.isArmed())))
  {
    if(modeName != 'GUIDED' && threeDR.isConnected())
    {
      if(modePending == null)
      {
        modePending = 'GUIDED';
        threeDR.guided();
        yield threeDR.waitForMode('GUIDED');
        modePending = null;
      }
    }
    else
    {
      if(nextPlanId == null) nextPlanId = 0;
      else nextPlanId = nextPlanId + 1;

      if(goal.plan == "parallel")
      {
        let planData = yield assemblePlanData(nextPlanId);

        if(!isNaN(planData.home.speed) && !isNaN(planData.key.speed) && !isNaN(planData.target.speed)) yield planParallelCourse(planData);
      }
      else if(goal.plan == "tether")
      {
        let planData = yield assemblePlanData(nextPlanId);

        if(!isNaN(planData.home.speed) && !isNaN(planData.key.speed)) yield planTetheredCourse(planData);
      }
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

const updateGoal = Promise.coroutine(function *()
{
  let target = gpsDB.getLoc('x');
  let key = gpsDB.getLoc(keyId);

  if(home && home.src.current && key && key.src.current)
  {
    let goalSerial = goal.serial;
    let now = new Date();
    let homeState = home.src.current;
    let homeSpeed = numerics.haversine(homeState.lat,homeState.long,homeState.lat + homeState.vLat,homeState.long + homeState.vLong);
    let homeAzmuth = numerics.forwardAzmuth(homeState.lat,homeState.long,homeState.lat + homeState.vLat,homeState.long + homeState.vLong);
    let keyState = key.src.current;
    let keySpeed = numerics.haversine(keyState.lat,keyState.long,keyState.lat + keyState.vLat,keyState.long + keyState.vLong);
    let keyAzmuth = numerics.forwardAzmuth(keyState.lat,keyState.long,keyState.lat + keyState.vLat,keyState.long + keyState.vLong);
    let targetState;
    let targetSpeed;
    let targetAzmuth;

    if(homeAzmuth < 0) homeAzmuth += 2*Math.PI;
    if(keyAzmuth < 0) keyAzmuth += 2*Math.PI;
    if(target && target.src.current)
    {
      targetState = target.src.current;
      targetSpeed = numerics.haversine(targetState.lat,targetState.long,targetState.lat + targetState.vLat,targetState.long + targetState.vLong);
      targetAzmuth = numerics.forwardAzmuth(targetState.lat,targetState.long,targetState.lat + targetState.vLat,targetState.long + targetState.vLong);
      if(targetAzmuth < 0) targetAzmuth += 2*Math.PI;
    }

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
      if(target && target.src.current)
      {
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
      }
    }
  }
});

gpsDB.addUpdate('*',Promise.coroutine(function *(gpsObj,prev)
{
  let now = new Date();

  home = gpsObj;
  if(isRecording) recordFlightData(gpsObj,now);
  if(isManuvering && goal.plan != null) yield updateGoal();
}));

const updateParallelTarget = Promise.coroutine(function *(gpsObj)
{
  let now = new Date();

  if(separationVectors[gpsObj.id] == null)
  {
    let azmuth = numerics.forwardAzmuth(gpsObj.src.current.lat,gpsObj.src.current.long,home.src.current.lat,home.src.current.long);
    let distance = numerics.haversine(gpsObj.src.current.lat,gpsObj.src.current.long,home.src.current.lat,home.src.current.long);


    separationVectors[gpsObj.id] =
    {
      azmuth:azmuth,
      distance:distance,
      alt:home.src.current.alt - gpsObj.src.current.alt
    };

/*
    separationVectors[gpsObj.id] =
    {
      vector:[home.src.current.lat - gpsObj.src.current.lat,home.src.current.long - gpsObj.src.current.long,home.src.current.alt - gpsObj.src.current.alt]
    };
    */

    gpsDB.addGPSCoord("x","target",now.valueOf(),home.src.current.lat,home.src.current.long,home.src.current.alt);
  }
  else
  {
    /*
    let translated =
    {
      lat:gpsObj.src.current.lat + separationVectors[gpsObj.id].vector[0],
      long:gpsObj.src.current.long + separationVectors[gpsObj.id].vector[1],
      alt:gpsObj.src.current.alt + separationVectors[gpsObj.id].vector[2]
    };
    */

    let LL = numerics.destination(gpsObj.src.current.lat,gpsObj.src.current.long,separationVectors[gpsObj.id].azmuth,separationVectors[gpsObj.id].distance);

    let translated =
    {
      lat:LL[0],
      long:LL[1],
      alt:gpsObj.src.current.alt + separationVectors[gpsObj.id].alt
    };

    gpsDB.addGPSCoord("x","target",now.valueOf(),translated.lat,translated.long,translated.alt);
  }
});

const deviceUpdate = Promise.coroutine(function *(gpsObj,prev)
{
  if(home != null && keyId == gpsObj.id)
  {
    if(goal.plan == "parallel") yield updateParallelTarget(gpsObj);
    if(goal.plan != null) updateGoal();
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

const arm = Promise.coroutine(function *()
{
  let modeName = threeDR.modeName();

  if(modeName != 'STABILIZE' && threeDR.isConnected())
  {
    threeDR.stabilize();
    yield threeDR.waitForMode('STABILIZE');
    modeName = threeDR.modeName();
  }
  if(modeName != 'GUIDED' && threeDR.isConnected())
  {
    threeDR.guided();
    yield threeDR.waitForMode('GUIDED');
    threeDR.arm();
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
  arm: function() { arm(); },
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
  launch: function()
  {
    threeDR.launch();
  },
  loiter: function()
  {
    goal.plan = null;
    isManuvering = false;
    threeDR.loiter();
  },
  parallel: function(id)
  {
    if(keyId != null) gpsDB.clearUpdates(keyId);
    goal.plan = "parallel";
    keyId = id;
    separationVectors[id] = null;
    gpsDB.addUpdate(id,deviceUpdate);
  },
  tether: function(id)
  {
    if(keyId != null) gpsDB.clearUpdates(keyId);
    goal.plan = "tether";
    keyId = id;
    separationVectors[id] = null;
    gpsDB.addUpdate(id,deviceUpdate);
  },
  rtl: function()
  {
    goal.plan = null;
    isManuvering = false;
    threeDR.rtl();
  },
  stop: function() { goal.plan = "stop"; },
  track: function() { isManuvering = true; },
  untrack: function()
  {
    goal.plan = null;
    isManuvering = false;
  }
}
