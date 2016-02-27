"use strict";

const Promise = require('bluebird');
const commands = require('./commands');
let program = require('commander');

program
  .option('-h, --host [hostname]', 'hostname [localhost]',"localhost")
  .option('-d, --delay [delay]', 'delay between samples in milliseconds [100]',100)
  .option('-n, --noise [noise]', 'inaccuracy in meters [3]',3)
  .parse(process.argv);

const meterLengthInDegrees = 8.546351e-6;
const altitudeInaccuracy = 0.01;

function addNoise(x,inaccuracy)
{
  return x + Math.random()*2*inaccuracy - inaccuracy;
}

function gpsNoise(x)
{
  return addNoise(x,meterLengthInDegrees*program.noise);
}

function altitudeNoise(x)
{
  return addNoise(x,altitudeInaccuracy);
}

const sendSeries = Promise.promisify(function(count,src,done)
{
  function sendPointInSeries()
  {
    let coords = src.next();
    let noise = [gpsNoise(coords.value.lat),gpsNoise(coords.value.long),altitudeNoise(coords.value.alt)];

    console.log("sending: ",noise);
    commands.send("http://" + program.host + ":3000/",coords.value.id,coords.value.name,noise[0],noise[1],noise[2]);
    setTimeout(function()
    {
      if(--count == 0) done();
      else sendPointInSeries();
    },program.delay);
  }

  sendPointInSeries();
});

module.exports =
{
  sendSeries:sendSeries
};
