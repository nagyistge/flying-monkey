"use strict";

const engine = require('../numerics')();
const Promise = require('bluebird');

const cbtab =
{
  'kalman.InitialGuess': Promise.coroutine(function *(args)
  {
    return yield engine.kalmanInitialGuess(args[0],args[1]);
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
      if(msg.fnName != null) cb({ res:cbtab[msg.fnName](args) });
    });
  }
};
