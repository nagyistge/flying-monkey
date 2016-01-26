var util = require('util');
var EventEmitter = require('events');
var PythonShell = require('python-shell');

function GPSSource()
{
  EventEmitter.call(this);

}

util.inherits(GPSSource,EventEmitter);
