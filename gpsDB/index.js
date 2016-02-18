"use strict";

const gpsSourceFactory = require('./gpsSource');
const Promise = require('bluebird');

var x = gpsSourceFactory.newSource();
var gpsCoordinates = {};
var keyDevice = null;

function prune()
{
  var now = new Date();
  var newGPSCoordinates = {};

  for(deviceId in gpsCoordinates)
  {
    var newSamples = [];
    var deviceSamples = gpsCoordinates[deviceId].samples;

    for(i = 0;i < deviceSamples.length;i++)
    {
      if(now.valueOf() - 5000 < deviceSamples[i].millis) newSamples.push(deviceSamples[i]);
      else console.log("pruned ",deviceSamples[i]);
    }
    if(newSamples.length > 0)
    {
      newGPSCoordinates[deviceId] = {};
      newGPSCoordinates[deviceId].deviceId = gpsCoordinates[deviceId].deviceId;
      newGPSCoordinates[deviceId].deviceName = gpsCoordinates[deviceId].deviceName;
      newGPSCoordinates[deviceId].samples = newSamples;
    }
  }
  gpsCoordinates = newGPSCoordinates;
}

function getFeatureInfo()
{
  var key = keyDevice;
  var center = { lat:0, long:0 };
  var features = [];
  var center = { lat:0, long:0 };

  for(deviceId in gpsCoordinates)
  {
    var deviceInfo = gpsCoordinates[deviceId];
    var deviceName = deviceInfo.deviceName;
    var samples = deviceInfo.samples;

    if(key == null) key = deviceId;
    if(key == deviceId)
    {
       center.lat = samples[0].lat;
       center.long = samples[0].long;
    }

    for(var i = 0;i < samples.length;i++)
    {
      features.push({
        type:"Feature",
        geometry:{ type:"Point", coordinates:[samples[i].long,samples[i].lat] },
        properties:{ title:deviceName }
      });
    }
  }
  return { features:features, center:center };
}


//setInterval(prune,500);

function addGPSCoord(deviceId,deviceName,millis,lat,long,alt)
{
  let source = gpsCoordinates[deviceId];

  if(source == null)
  {
      source = 
      { 
        deviceId:deviceId,
        deviceName:deviceName,
        ops:gpsSourceFactory.newSource()
      };

      gpsCoordinates[deviceId] = source;
  }

  console.log("adding: lat = ",lat,"long = ",long);
  source.ops.addCoordinate(millis,lat,long,alt);
  
  let predictedValue = source.ops.predict();

  console.log("predictedValue = ",predictedValue);
}

module.exports =
{
  getGPSCoords: function()
  {
    return gpsCoordinates;
  },
  addGPSCoord: addGPSCoord,
  getKeyDevice: function() { return keyDevice; },
  getKeyDevice: function(deviceId) { keyDevice = deviceId; },
  getFeatureInfo: getFeatureInfo
};
