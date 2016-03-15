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
  haversine: Promise.promisify(nav_geo.haversine),
  forwardAzmuth:  Promise.promisify(nav_geo.forwardAzmuth)
}
