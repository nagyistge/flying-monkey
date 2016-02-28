"use strict";

const gpsSourceFactory = require('./gpsSource');
const Promise = require('bluebird');

let x = gpsSourceFactory.newSource();
let gpsCoordinates = {};
let keyDevice = "*";
let router = {};

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

    if(key == id)
    {
      center.lat = current.lat;
      center.long = current.long;
      center.alt = current.alt;

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
    else
    {
      features.push({
        type:"Feature",
        geometry:{ type:"Point", coordinates:[current.long,current.lat] },
        properties:
        {
          title:name,
          "marker-size":"medium",
          "marker-symbol":"mobilephone",
          "marker-color":"#FF1493"
        }
      });
    }
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
  locus.src.predict().then(function(predictedValue)
  {
    let previous = locus.src.current;

    locus.src.current = predictedValue;
    if(router[id] != null)
    {
      let routes = router[id];

      for(let i = 0;i < routes.length;i++) routes[i](locus,previous);
    }
  });
}

function getIdList()
{
  let gpsIdList = {};
  let i = 0;

  for(let id in gpsCoordinates)
  {
    let deviceInfo = gpsCoordinates[id];
    let name = deviceInfo.name;
    let current = deviceInfo.src.current;

    gpsIdList[id] = {};
    gpsIdList[id].id = id;
    gpsIdList[id].name = name;
    gpsIdList[id].current = current;
  }
  return gpsIdList;
}

function getVector(id)
{
  var v;

  if(keyDevice != null)
  {
    deviceInfo = gpsCoordinates[id];
    deviceInfo = gpsCoordinates[keyDevice];

    if(keyDevice != null && keyDevice.current != null && deviceInfo != null && deviceInfo.current != null)
      v = [deviceInfo.current.lat - keyDevice.current.lat,deviceInfo.current.long - keyDevice.current.long,deviceInfo.current.alt - keyDevice.current.alt];
  }
  return v;
}

function update(id,callback)
{
  if(router[id] == null) router[id] = [];
  router[id].push(callback);
}

function getLocus(id)
{
   return gpsCoordinates[id];
}

module.exports =
{
  getGPSCoords: function()
  {
    return gpsCoordinates;
  },
  addGPSCoord: addGPSCoord,
  getKeyDevice: function() { return keyDevice; },
  setKeyDevice: function(id) { keyDevice = id; },
  getFeatureInfo: getFeatureInfo,
  getIdList: getIdList,
  getVector: getVector,
  update:update,
  getLocus:getLocus
};
