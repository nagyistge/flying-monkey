"use strict";

const numerics = require('../numerics')();
const Promise = require('bluebird');

let modelHandleTable = [];
let mhtNext = 0;
let stateHandleTable = [];
let shtNext = 0;

const cbtab =
{
  'kalman.initialGuess': Promise.coroutine(function *(args)
  {
    let handle = shtNext++;
    let O = new Float64Array(3);
    let Q = new Float64Array(3);

    for(let i = 0;i < 3;i++)
    {
      O[i] = args[0][i];
      Q[i] = args[1][i];
    }

    stateHandleTable[handle] = yield numerics.kalmanInitialGuess(O,Q);
    return handle;
  }),
  'kalman.newModel': Promise.coroutine(function *(args)
  {
    let handle = mhtNext++;

    modelHandleTable[handle] = yield numerics.kalmanNewModel(args[0],args[1],args[2],args[3]);
    return handle;
  }),
  'kalman.predict': Promise.coroutine(function *(args)
  {
    let model = modelHandleTable[args[1]];
    let state = stateHandleTable[args[2]];
    let predictedState = null;

    if(model != null && state != null) predictedState = yield numerics.kalmanPredict(args[0],model,state);
    if(predictedState != null)
    {
      stateHandleTable[shtNext++] = predictedState;
      return shtNext - 1;
    }
    else return null;
  }),
  'kalman.extractMeanFromState': Promise.coroutine(function *(args)
  {
    let state = stateHandleTable[args[0]];

    if(state != null) return yield numerics.kalmanStateMean(state)
    return null;
  }),
  'kalman.extractVarianceFromState': Promise.coroutine(function *(args)
  {
    let state = stateHandleTable[args[0]];

    if(state != null) return yield numerics.kalmanStateVariance(state);
    return null;
  }),
  'kalman.update': Promise.coroutine(function *(args)
  {
    let model = modelHandleTable[args[1]];
    let state = stateHandleTable[args[2]];
    let O = new Float64Array(3);
    let newState = null;

    for(let i = 0;i < 3;i++) O[i] = args[3][i];
    if(model != null && state != null) newState = yield numerics.kalmanUpdate(args[0],model,state,O,args[4]);
    if(newState != null)
    {
      stateHandleTable[shtNext++] = newState;
      return shtNext - 1;
    }
    return null;
  })
};

module.exports =
{
  onConnection: function(socket)
  {
    console.log('a user connected');
    socket.on('drone-chan',function(from,msg,cb)
    {
      console.log(`evaluating  ${msg.fnName} using ${msg.args}`);
      if(msg.fnName != null) cbtab[msg.fnName](msg.args).then(cb);
    });
  }
};
