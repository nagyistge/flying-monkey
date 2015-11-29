var gpsCoord = { lat:38.8929, long:-77.0252, altitude:0 };

module.exports = 
{
   getGPSCoord: function()
   {
      return gpsCoord;
   },
   setGPSCoord: function(lat,long)
   {
      gpsCoord.lat = lat;
      gpsCoord.long = long;
   }
};
