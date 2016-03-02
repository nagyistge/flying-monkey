"use strict";

const PythonShell = require('python-shell');
const Promise = require('bluebird');
const gpsDB = require('../gpsDB');

let router =
{
  RTL: [],
  GUIDED: []
};

let shell;
let isArmed = false;
let modeName = null;

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

        gpsDB.addGPSCoord("*","solo",new Date(),coords.lat,coords.long,coords.alt);
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
        console.log("isArmed updateed to: ",isArmed);
      }
    }
    catch(e) {}
  });

  shell.on('error',function(message)
  {
    console.log("python error:\n\n",message);
  });
  done();
});

init().then(function() { shell.send("mode"); });

const waitForMode = Promise.promisify(function(targetModeName,done)
{
  if(shell != null)
  {
    if(modeName == targetModeName) done();
    else
    {
      let callbackList = router[targetModeName];

      if(callbackList = null) callbackList.push(done);
    }
  }
});

module.exports =
{
  goto:function(lat,long,alt,speed)
  {
    if(shell != null && isArmed) shell.send(`goto ${lat} ${long} ${alt} ${speed}`);
  },
  isArmed:function() { return isArmed; },
  modeName:function() { return modeName; },
  rtl:function()
  {
    if(shell != null && isArmed) shell.send("rtl");
  },
  guided:function()
  {
    if(shell != null && isArmed) shell.send("guided");
  },
  waitForMode: function(targetModeName)
  {
    if(shell != null) return waitForMode(targetModeName);
  }
}
