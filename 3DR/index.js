"use strict";

const PythonShell = require('python-shell');
const Promise = require('bluebird');
const gpsDB = require('../gpsDB');

let router =
{
  RTL: [],
  GUIDED: [],
  LOITER: [],
  STABILIZE: [],
  attitude: [],
  gimbal: [],
  homeLocation: [],
  velocity: []
};

let shell;
let isArmed = false;
let modeName = null;
let homeLocation = null;
let isConnected = null;
let attitude = null;

const init = Promise.promisify(function(done)
{
  shell = new PythonShell('droneAPI.py',
  {
    scriptPath:"3DR",
    pythonOptions: ['-u']
  });

  shell.on('message',function(message)
  {
    try
    {
      let json = JSON.parse(message);

      if(json.gpsCoords != null)
      {
        let coords = json.gpsCoords;
        let now = new Date();

        gpsDB.addGPSCoord("*","solo",now.valueOf(),coords.lat,coords.long,coords.alt);
      }
      else if(json.modeName != null)
      {
        modeName = json.modeName;

        console.log("modeName updateed to: ",modeName);
        let callbackList = router[modeName];

        if(callbackList != null)
        {
          router[modeName] = [];
          for(let i = 0;i < callbackList.length;i++) callbackList[i]();
        }
      }
      else if(json.isArmed != null)
      {
        isArmed = json.isArmed;
        console.log("isArmed updated to: ",isArmed);
	getHomeLocation();
      }
      else if(json.homeLocation != null)
      {
        homeLocation = json.homeLocation;

        let callbackList = router['homeLocation'];

        if(callbackList != null)
        {
          router[homeLocation] = [];
          for(let i = 0;i < callbackList.length;i++) callbackList[i](null,homeLocation.value);
        }
      }
      else if(json.velocity != null)
      {
        let value = json.velocity.value;
        let velocity;

        if(value != null) velocity = { vn:value[1], ve:value[0], vd:value[2] };
        let callbackList = router['velocity'];

        if(callbackList != null)
        {
          router['velocity'] = [];
          for(let i = 0;i < callbackList.length;i++) callbackList[i](null,velocity);
        }
      }
      else if(json.isConnected != null) isConnected = json.isConnected;
      else if(json.attitude != null)
      {
        let attitude = json.attitude.value;
        let callbackList = router['attitude'];

        for(let i = 0;i < callbackList.length;i++) callbackList[i](null,attitude);
      }
      else if(json.gimbal != null)
      {
        let gimbal = json.gimbal.value;
        let callbackList = router['gimbal'];

        if(callbackList != null)
        {
          router['gimbal'] = [];
          for(let i = 0;i < callbackList.length;i++) callbackList[i](null,gimbal);
        }
      }
      else if(json.cmd != null) console.log("cmd: ",json.cmd);
      else console.log("unidentified json: ",JSON.stringify(json,null,2));
    }
    catch(e)
    {
       console.log("some error ",e,message);
    }
  });

  shell.on('error',function(message)
  {
    console.log("python error:\n\n",message);
  });
  done();
});

function setAttitude(err,value)
{
   if(err == null) attitude = value;
}

const waitForMode = Promise.promisify(function(targetModeName,done)
{
  if(shell != null)
  {
    if(modeName == targetModeName) done();
    else
    {
      let callbackList = router[targetModeName];

      if(callbackList != null) callbackList.push(done);
    }
  }
});

const getVariable = Promise.promisify(function(cmd,variableName,done)
{
  if(shell != null)
  {
    let callbackList = router[variableName];

    if(callbackList != null) callbackList.push(done);
    shell.send(cmd);
  }
});

const getHomeLocation = Promise.coroutine(function *()
{
  homeLocation = yield getVariable('getHomeLocation','homeLocation');
});

init().then(function()
{
  try
  {
    if(shell != null)
    {
      shell.send("mode");
      router['attitude'].push(setAttitude);
    }
  }
  catch(e) { shell = null; }
});

module.exports =
{
  arm: function()
  {
    if(shell != null && !isArmed) shell.send('arm');
  },
  getAttitude:function() { return attitude; },
  getGimbal:Promise.coroutine(function *()
  {
    return yield getVariable('getGimbal','gimbal');
  }),
  getHomeLocation:function() { return homeLocation; },
  getVelocity:Promise.coroutine(function *()
  {
    return yield getVariable('getVelocity','velocity');
  }),
  goto:function(lat,long,alt,speed)
  {
    if(shell != null && isArmed) shell.send(`goto ${lat} ${long} ${alt} ${speed}`);
  },
  guided:function()
  {
    if(shell != null) shell.send("guided");
  },
  isArmed:function() { return isArmed; },
  isConnected:function() { return isConnected; },
  launch: function()
  {
    if(shell != null && isArmed) shell.send("launch");
  },
  loiter:function()
  {
    if(shell != null && isArmed) shell.send("loiter");
  },
  modeName:function() { return modeName; },
  rotateGimbal:function(pitch)
  {
    if(shell != null) shell.send(`rotateGimbal ${pitch}`);
  },
  rtl:function()
  {
    if(shell != null && isArmed) shell.send("rtl");
  },
  setROI:function(lat,long,alt)
  {
    if(shell != null && isArmed) shell.send(`setROI ${lat} ${long} ${alt}`);
  },
  setVelocity:function(vn,ve,vd)
  {
    if(shell != null && isArmed) shell.send(`setVelocity ${vn} ${ve} ${vd}`);
  },
  setYaw:function(yaw)
  {
    if(shell != null && isArmed) shell.send(`setYaw ${yaw}`);
  },
  stabilize:function()
  {
    if(shell != null) shell.send("stabilize");
  },
  waitForMode: function(targetModeName)
  {
    if(shell != null) return waitForMode(targetModeName);
  }
}
