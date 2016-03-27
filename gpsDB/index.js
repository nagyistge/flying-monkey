"use strict";

const gpsSourceFactory = require('./gpsSource');
const Promise = require('bluebird');

//let x = gpsSourceFactory.newSource();
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
  let gpsObj = gpsCoordinates[id];

  if(gpsObj == null)
  {
      gpsObj =
      {
        id:id,
        name:name,
        src:gpsSourceFactory.newSource(id,lat,long,alt)
      };

      gpsCoordinates[id] = gpsObj;
  }

  gpsObj.src.addCoordinate(millis,lat,long,alt);
  gpsObj.src.predict().then(function(predictedValue)
  {
    let previous = gpsObj.src.current;

    gpsObj.src.current = predictedValue;
    if(router[id] != null)
    {
      let routes = router[id];

      for(let i = 0;i < routes.length;i++) routes[i](gpsObj,previous);
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

function addUpdate(id,callback)
{
  if(router[id] == null) router[id] = [];
  router[id].push(callback);
}

function clearUpdates(id)
{
  if(router[id] != null) router[id] = [];
}

function getLoc(id)
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
  addUpdate: addUpdate,
  clearUpdates: clearUpdates,
  getKeyDevice: function() { return keyDevice; },
  getFeatureInfo: getFeatureInfo,
  getIdList: getIdList,
  getVector: getVector,
  getLoc:getLoc,
  setKeyDevice: function(id) { keyDevice = id; }
};
