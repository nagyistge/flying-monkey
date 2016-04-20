"use strict";

const PythonShell = require('python-shell');
const Promise = require('bluebird');
const gpsDB = require('../gpsDB');

let router =
{
  RTL: [],
  GUIDED: [],
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
      }
      else if(json.homeLocation != null)
      {
        homeLocation = json.homeLocation;

        console.log("homeLocation set to: ",homeLocation);
        let callbackList = router['homeLocatoin'];

        if(callbackList != null)
        {
          router[homeLocation] = [];
          for(let i = 0;i < callbackList.length;i++) callbackList[i](homeLocation);
        }
      }
      else if(json.velocity != null)
      {
        let velocity = { vn:json.velocity.vx, ve:json.velocity.vy, vd:json.velocity.vz };
        let callbackList = router['velocity'];

        if(callbackList != null)
        {
          router['velocity'] = [];
          for(let i = 0;i < callbackList.length;i++) callbackList[i](velocity);
        }
      }
      else if(json.isConnected != null) isConnected = json.isConnected;
      else if(json.attitude != null)
      {
        let attitude = json.attitude;
        let callbackList = router['attitude'];

        if(callbackList != null)
        {
          router['attitude'] = [];
          for(let i = 0;i < callbackList.length;i++) callbackList[i](attitude);
        }
      }
      else if(json.gimbal != null)
      {
        let gimbal = json.gimbal;
        let callbackList = router['attitude'];

        if(callbackList != null)
        {
          router['gimbal'] = [];
          for(let i = 0;i < callbackList.length;i++) callbackList[i](gimbal);
        }
      }
      else if(json.cmd != null) console.log("cmd: ",json.cmd);
    }
    catch(e) {}
  });

  shell.on('error',function(message)
  {
    console.log("python error:\n\n",message);
  });
  done();
});

init().then(function()
{
  try
  {
    if(shell != null) shell.send("mode");
  }
  catch(e) { shell = null; }
});

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

const getVariable = Promise.promisify(function(variableName,done)
{
  if(shell != null)
  {
    let callbackList = router[variableName];

    if(callbackList != null) callbackList.push(done);
  }
});

module.exports =
{
  arm: function()
  {
    if(shell != null && !isArmed) shell.send('arm');
  },
  getAttitude:Promise.coroutine(function *()
  {
    return yield getVariable('attitude');
  }),
  getGimbal:Promise.coroutine(function *()
  {
    return yield getVariable('gimbal');
  }),
  getHomeLocation:Promise.coroutine(function *()
  {
    if(homeLocation != null) return homeLocation;
    return yield getVariable('homeLocation');
  }),
  getVelocity:Promise.coroutine(function *()
  {
    return yield getVariable('velocity');
  }),
  goto:function(lat,long,alt,speed)
  {
    if(shell != null && isArmed) shell.send(`goto ${lat} ${long} ${alt} ${speed}`);
  },
  guided:function()
  {
    if(shell != null && isArmed) shell.send("guided");
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
  setVelocity:function(vn,ve,vd)
  {
    if(shell != null && isArmed) shell.send(`setVelocity ${vn} ${ve} ${vd}`);
  },
  setYaw:function(yaw)
  {
    if(shell != null && isArmed) shell.send(`setYaw ${yaw}`);
  },
  waitForMode: function(targetModeName)
  {
    if(shell != null) return waitForMode(targetModeName);
  }
}
