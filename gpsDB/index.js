"use strict";

const gpsSourceFactory = require('./gpsSource');
const Promise = require('bluebird');

var x = gpsSourceFactory.newSource();
var gpsCoordinates = {};
var keyDevice = null;

function getFeatureInfo()
{
  let key = keyDevice;
  let center = { lat:0, long:0, alt:0 };
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
      center.alt = current.alt;

      for(let i = 0;i < samples.length;i++)
      {
        features.push({
          type:"Feature",
          geometry:{ type:"Point", coordinates:[samples[i].long,samples[i].lat] },
          properties:
          { 
            title:"gps",
            "marker-size":"small",
            "marker-symbol":"circle",
            "marker-color":"#7FFF00"
          }
        });
      }
      features.push({
        type:"Feature",
        geometry:{ type:"Point", coordinates:[current.long,current.lat] },
        properties:
        { 
          title:name,
          "marker-size":"large",
          "marker-symbol":"star",
          "marker-color":"#FFDF00"
        }
      });
    }
  }

  return { features:features, center:center };
}

function addGPSCoord(id,name,millis,lat,long,alt)
{
  let locus = gpsCoordinates[id];

  if(locus == null)
  {
      locus =
      {
        id:id,
        name:name,
        src:gpsSourceFactory.newSource(lat,long,alt)
      };

      gpsCoordinates[id] = locus;
  }

  locus.src.addCoordinate(millis,lat,long,alt);
  locus.src.predict().then(function(predictedValue) { locus.src.current = predictedValue; });
}

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
