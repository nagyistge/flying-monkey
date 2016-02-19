"use strict";

const julia = require('node-julia');
const kalman = julia.import('gpsDB/kalman');
const Promise = require('bluebird');

/***
*   promisify initialGuess
*   Args:
*    initialObservation:  [lat,long]
*    initialVariance:     [latVar,longVar]
*    callback:            function(err,predictedState)
*/
const initialGuess = Promise.promisify(kalman.initialGuess);


/***
*   promisify newModel
*   Args:
*    processVariance:          The model process variance
*    observationVariance::     The model observation variance
*    callback:                 function(err,model)
*/
const newModel = Promise.promisify(kalman.newModel);


/***
*   promisify predict
*   Args:
*    model:          The model
*    state::         The current state
*    callback:       function(err,[lat,long])
*/
const predict = Promise.promisify(function(model,state,callback)
{
  kalman.predict(model,state,function(err,predictedState)
  {
     kalman.extractMeanFromState(predictedState,callback);
  });
});

const update = Promise.promisify(function(model,state,sample,callback)
{
  let predictedState = kalman.predict(model,state);
  let observations = new Float64Array([sample.lat,sample.long]);

  kalman.update(model,predictedState,observations,function(err,newState) { callback(err,newState); });
});

function gpsSource(latitude0,longitude0)
{
  this.samples = [];
  this.latitude0 = latitude0;
  this.longitude0 = longitude0;
}

gpsSource.prototype.addCoordinate = Promise.coroutine(function*(millis,lat,long,alt)
{
  let sample = { millis:millis, lat:lat, long:long, alt:alt };

  try
  {
    if(this.samples.length == 0)
    {
      let initialObservation = new Float64Array([lat,long]);
      let initialVariance = new Float64Array([0.01,0.01]);

      this.state = yield initialGuess(initialObservation,initialVariance);
      this.model = yield newModel(0.01,0.01);
      this.samples = [sample];
    }
    else this.samples.push(sample);
    this.state = yield update(this.model,this.state,sample);
  }
  catch(e)
  {
    console.log("kalman failed:",e);
  }
});

gpsSource.prototype.defaultGPS = function(callback)
{
  let res =  { lat:this.latitude0, long:this.longitude0, alt:0 };

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
    let coordArray =yield predict(this.model,this.state);
    
    res = { lat:coordArray[0], long:coordArray[1], alt:0 };
  }
  else res = yield defaultGPS(this);
  return res;
});

module.exports =
{
   newSource: function(latitude0,longitude0) { return new gpsSource(latitude0,longitude0); }
}
