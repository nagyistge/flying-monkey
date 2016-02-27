"use strict";

const commands = require('./commands');
let program = require('commander');

program
  .option('-h, --host [hostname]', 'hostname [localhost]',"localhost")
  .parse(process.argv);

commands.send("http://" + program.host + ":3000/","*","solo",19.823061,-155.469247,5199.888);
