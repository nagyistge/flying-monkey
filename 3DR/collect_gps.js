"use strict";

const PythonShell = require('python-shell');


module.exports = function(DB)
{
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
      DB.addGPSCoord("000000000000","solo",new Date(),coords.lat,coords.long,coords.alt);
    }
    catch(e) {}
  });

  pyshell.on('error',function(msg)
  {
    console.log("error = ",msg);
  });
}
