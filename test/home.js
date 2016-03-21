"use strict";

const commands = require('./commands');
let program = require('commander');

program
  .option('-h, --host [hostname]', 'hostname [localhost]',"localhost")
  .parse(process.argv);

//commands.send("http://" + program.host + ":3000/","*","solo",19.823061,-155.469247,5199.888);
//commands.send("http://" + program.host + ":3000/","*","solo",37.785834,-122.406417,5199.888);
commands.send("http://" + program.host + ":3000/","*","solo",35.800677270634104,-78.7712867669927,186.0);
