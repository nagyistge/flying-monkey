"use strict";

const julia = require('node-julia');
const kalman = julia.import('gpsDB/kalman');
const Promise = require('bluebird');

/**
 * @callback stateCallback
 * @param {string} err
 * @param {state} predictedState The next state
 */

/**
 * @function initialGuess
 * @arg {array} initialObservation Array of [lat,long,alt]
 * @arg {vector} initialVariance: Array of [latVar,longVar,altVar]
 * @arg {stateCallback} callback
*/
const initialGuess = Promise.promisify(kalman.initialGuess);

/**
 * @function newModel
 * @arg processVariance:          The model process variance
 * @arg observationVariance::     The model observation variance
 * @ arg callback:                 function(err,model)
 */
const newModel = Promise.promisify(kalman.newModel);

/**
 * @function predict
 * @arg {model} model The model
 * @arg {state} state The current state
 * @arg {functiion} callback       function(err,predictedState)
 */
const predict = Promise.promisify(kalman.predict);
const extractMean = Promise.promisify(kalman.extractMeanFromState);
const extractVariance = Promise.promisify(kalman.extractVarianceFromState);
const update = Promise.promisify(kalman.update);

function gpsSource(latitude0,longitude0,altitude0)
{
  this.samples = [];
  this.latitude0 = latitude0;
  this.longitude0 = longitude0;
  this.altitude0 = altitude0;
  this.initialized = false;
}

gpsSource.prototype.addCoordinate = Promise.coroutine(function*(millis,lat,long,alt)
{
  let sample = { millis:millis, lat:lat, long:long, alt:alt };

  try
  {
    if(!this.initialized)
    {
      let initialObservation = new Float64Array([lat,long,alt]);
      let initialVariance = new Float64Array([0.01,0.01,0.01]);

      this.state = yield initialGuess(initialObservation,initialVariance);
      this.model = yield newModel(0.0001,0.003);
      this.samples = [sample];
      this.initialized = true;
    }
    else
    {
      this.samples.push(sample);

      let predictedState = yield predict(this.model,this.state);
      let observations = new Float64Array([sample.lat,sample.long,sample.alt]);

      this.state = yield update(this.model,predictedState,observations);
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
    let predictedState = yield predict(this.model,this.state);
    let coordArray = yield extractMean(predictedState);
    let varianceArray = yield extractVariance(predictedState);

    res = { lat:coordArray[0], long:coordArray[1], alt:coordArray[2], latVar:varianceArray[0], longVar:varianceArray[1], altVar:varianceArray[2] };
  }
  else res = yield defaultGPS(this);
  return res;
});

gpsSource.prototype.prune = function()
{
  let now = new Date();
  let newSamples = [];

  for(let i = 0;i < this.samples.length;i++)
  {
    if(now.valueOf() - 5000 < this.samples[i].millis) newSamples.push(this.samples[i]);
  }
  this.samples = newSamples;
}


module.exports =
{
  newSource: function(latitude0,longitude0,altitude0)
  {
    let source = new gpsSource(latitude0,longitude0,altitude0);

     setInterval(function() { source.prune(); },500);
     return source;
  }
}
