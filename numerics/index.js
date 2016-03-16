"use strict";

const julia = require('node-julia');
const Promise = require('bluebird');
const kalman = julia.import('./numerics/kalman');
const nav_geo = julia.import('./numerics/nav_geo');

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

/**
 * @function newModel
 * @arg processVariance:          The model process variance
 * @arg observationVariance::     The model observation variance
 * @ arg callback:                 function(err,model)
 */

/**
 * @function predict
 * @arg {model} model The model
 * @arg {state} state The current state
 * @arg {functiion} callback       function(err,predictedState)
 */

module.exports =
{
  kalmanInitialGuess: Promise.promisify(kalman.initialGuess),
  kalmanNewModel: Promise.promisify(kalman.newModel),
  kalmanPredict: Promise.promisify(kalman.predict),
  kalmanStateMean: Promise.promisify(kalman.extractMeanFromState),
  kalmanStateVariance: Promise.promisify(kalman.extractVarianceFromState),
  kalmanUpdate: Promise.promisify(kalman.update),
  haversine: Promise.promisify(function(lat1,long1,lat2,long2,done)
  {
    let args = new Float64Array(4);

    args[0] = lat1;
    args[1] = long1;
    args[2] = lat2;
    args[3] = long2;
    nav_geo.haversine(args,done);
  }),
  forwardAzmuth: Promise.promisify(function(lat1,long1,lat2,long2,done)
  {
    let args = new Float64Array(4);

    args[0] = lat1;
    args[1] = long1;
    args[2] = lat2;
    args[3] = long2;
    nav_geo.forwardAzmuth(args,done);
  })
}
