"use strict";

const PythonShell = require('python-shell');
const gpsDB = require('../gpsDB');

var pyshell = new PythonShell('collect_gps.py',
{
  scriptPath:"3DR",
  pythonOptions: ['-u']
});

pyshell.on('message',function (msg)
{
  try
  {
    var coords = JSON.parse(msg);
    gpsDB.addGPSCoord("*","solo",new Date(),coords.lat,coords.long,coords.alt);
  }
  catch(e) {}
});

pyshell.on('error',function(msg)
{
  console.log("error = ",msg);
});

module.exports =
{
  goto:function()
  {
    pyshell.send("goto");
  }
}
