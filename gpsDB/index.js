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


setInterval(prune,500);

module.exports =
{
  getGPSCoords: function()
  {
    return gpsCoordinates;
  },
  addGPSCoord: function(deviceId,deviceName,millis,lat,long,alt)
  {
    var gpsSrc = gpsCoordinates[deviceId];

    if(gpsSrc == null) gpsCoordinates[deviceId] = { deviceId:deviceId, deviceName:deviceName, samples:[{ millis:millis, lat:lat, long:long, alt:alt }] };
    else gpsSrc.samples.push({ millis:millis, lat:lat, long:long, alt:alt });
  },
  getKeyDevice: function() { return keyDevice; },
  getKeyDevice: function(deviceId) { keyDevice = deviceId; },
  getFeatureInfo: getFeatureInfo
};
