"use strict";

const PythonShell = require('python-shell');
const Promise = require('bluebird');
const gpsDB = require('../gpsDB');

let shell;

const init = Promise.promisify(function(done)
{
  shell = new PythonShell('dronekit.py',
  {
    scriptPath:"3DR",
    pythonOptions: ['-u']
  });

  shell.on('message',function(message)
  {
    try
    {
      let json = JSON.parse(message);

      if(json.gpsCoorde != null)
      {
        let coords = json.gpsCoords;

        gpsDB.addGPSCoord("*","solo",new Date(),coords.lat,coords.long,coords.alt);
      }
    }
    catch(e) {}
  });

  shell.on('error',function(message)
  {
    console.log("python error:\n\n",msg);
  });
  done();
});

Promise.resolve(init);

module.exports =
{
  goto:function(lat,long,alt)
  {
    if(shell != null)
    {
      shell.send(`goto ${lat} ${long} ${alt}`);
    }
  }
}
