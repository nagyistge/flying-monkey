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

  for(id in gpsCoordinates)
  {
    var newSamples = [];
    var deviceSamples = gpsCoordinates[id].samples;

    for(i = 0;i < deviceSamples.length;i++)
    {
      if(now.valueOf() - 5000 < deviceSamples[i].millis) newSamples.push(deviceSamples[i]);
      else console.log("pruned ",deviceSamples[i]);
    }
    if(newSamples.length > 0)
    {
      newGPSCoordinates[id] = {};
      newGPSCoordinates[id].id = gpsCoordinates[id].id;
      newGPSCoordinates[id].name = gpsCoordinates[id].name;
      newGPSCoordinates[id].samples = newSamples;
    }
  }
  gpsCoordinates = newGPSCoordinates;
}

function getFeatureInfo()
{
  let key = keyDevice;
  let center = { lat:0, long:0 };
  let features = [];

  for(let id in gpsCoordinates)
  {
    let deviceInfo = gpsCoordinates[id];
    let name = deviceInfo.name;
    let samples = deviceInfo.src.samples;
    let current = deviceInfo.src.current;

    if(key == null) key = id;
    if(key == id)
    {
       center.lat = current.lat;
       center.long = current.long;
    }

    for(var i = 0;i < samples.length;i++)
    {
      features.push({
        type:"Feature",
        geometry:{ type:"Point", coordinates:[samples[i].long,samples[i].lat] },
        properties:{ title:name }
      });
    }
  }
  return { features:features, center:center };
}


//setInterval(prune,500);

function addGPSCoord(id,name,millis,lat,long,alt)
{
  let locus = gpsCoordinates[id];

  if(locus == null)
  {
      locus =
      {
        id:id,
        name:name,
        src:gpsSourceFactory.newSource(lat,long)
      };

      gpsCoordinates[id] = locus;
  }

  locus.src.addCoordinate(millis,lat,long,alt);
  locus.src.predict().then(function(predictedValue) { locus.src.current = predictedValue; });
}

addGPSCoord("a","b",0,34,56,78);

module.exports =
{
  getGPSCoords: function()
  {
    return gpsCoordinates;
  },
  addGPSCoord: addGPSCoord,
  getKeyDevice: function() { return keyDevice; },
  getKeyDevice: function(id) { keyDevice = id; },
  getFeatureInfo: getFeatureInfo
};
