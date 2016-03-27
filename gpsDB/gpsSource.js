"use strict";

const Promise = require('bluebird');
const engine = require('../numerics');

function gpsSource(id,latitude0,longitude0,altitude0)
{
  this.id = id;
  this.stime = null;
  this.ptime = null;
  this.samples = [];
  this.latitude0 = latitude0;
  this.longitude0 = longitude0;
  this.altitude0 = altitude0;
  this.initializing = false;
  this.initialized = false;
}

gpsSource.prototype.addCoordinate = Promise.coroutine(function*(millis,lat,long,alt)
{
  let sample = { millis:millis, lat:lat, long:long, alt:alt };

  try
  {
    if(!this.initialized)
    {
      if(!this.initializing)
      {
        this.initializing = true;

        let initialObservation = new Float64Array([lat,long,alt]);
        let initialVariance = new Float64Array([0.01,0.01,0.01]);

        this.state = yield engine.kalmanInitialGuess(initialObservation,initialVariance);
        this.model = yield engine.kalmanNewModel(this.id,0.0001,4.368271880716285e-7,0.5);
        this.samples = [sample];
        this.initialized = true;
        this.stime = millis;
      }
    }
    else
    {
      let stime = this.stime;

      this.samples.push(sample);
      this.stime = millis;

      let predictedState = yield engine.kalmanPredict(this.id,this.model,this.state);
      let observations = new Float64Array([sample.lat,sample.long,sample.alt]);

      this.state = yield engine.kalmanUpdate(this.id,this.model,predictedState,observations,(millis - stime)/1000);
    }
  }
  catch(e)
  {
    console.log("kalman failed:",e);
  }
});

gpsSource.prototype.defaultGPS = function(callback)
{
  let res =  { lat:this.latitude0, long:this.longitude0, alt:this.altitude0, latVar:0, longVar:0, altVar:0 };

  callback(null,res);
}

const defaultGPS = Promise.promisify(function(src,callback)
{
   src.defaultGPS(callback);
});

gpsSource.prototype.predict = Promise.coroutine(function*()
{
  var res;

  if(this.model != null)
  {
    let predictedState = yield engine.kalmanPredict(this.id,this.model,this.state);
    let coordArray = yield engine.kalmanStateMean(predictedState);
    let varianceArray = yield engine.kalmanStateVariance(predictedState);

    res =
    {
      lat:coordArray[0],
      long:coordArray[1],
      alt:coordArray[2],
      vt:coordArray[3],
      vg:coordArray[4],
      va:coordArray[5],
      latVar:varianceArray[0],
      longVar:varianceArray[1],
      altVar:varianceArray[2]
    };
  }
  else res = yield defaultGPS(this);
  return res;
});

gpsSource.prototype.prune = function()
{
  let now = new Date();
  let newSamples = [];
  let maxTime;

  for(let i = 0;i < this.samples.length;i++)
    if(maxTime == null || maxTime < this.samples[i].millis) maxTime = this.samples[i].millis;
  if(maxTime != null)
  {
    if(this.ptime == null || this.ptime < maxTime - 5000) this.ptime = maxTime - 5000;
    else this.ptime += 500;
  }
  else this.ptime = null;

  console.log("ptime = ",this.ptime);

  for(let i = 0;i < this.samples.length;i++)
  {
    if(this.ptime != null && this.ptime < this.samples[i].millis) newSamples.push(this.samples[i]);
  }
  this.samples = newSamples;
}

module.exports =
{
  newSource: function(id,latitude0,longitude0,altitude0)
  {
    let source = new gpsSource(id,latitude0,longitude0,altitude0);

     setInterval(function() { source.prune(); },500);
     return source;
  }
}
