"use strict";

const julia = require('node-julia');
const kalman = julia.import('gpsDB/kalman');

function gpsSource()
{
   this.samples = [];
}

gpsSource.prototype.addCoordinate = function(millis,lat,long,alt)
{

  let sample = { millis:millis, lat:lat, long:long, alt:alt };

  function update(model,state,sample)
  {
    let predictedState = kalman.predict(model,state);
    let observations = new Float64Array([sample.lat,sample.long]);

    return kalman.update(model,predictedState,observations);
  }

  try
  {
    if(this.samples.length == 0)
    {
      let initialObservation = new Float64Array([lat,long]);
      let initialVariance = new Float64Array([0.01,0.01]);

      this.state = kalman.initialGuess(initialObservation,initialVariance);
      this.model = kalman.newModel(0.01,0.01);
      this.samples = [sample];
    }
    else this.samples.push(sample);
    this.state = update(this.model,this.state,sample);
  }
  catch(e)
  {
    console.log("kalman failed:",e);
  }
}

gpsSource.prototype.predict = function()
{
   return kalman.extractMeanFromState(kalman.predict(this.model,this.state));
}

module.exports = 
{
   newSource: function() { return new gpsSource() }
}
