"use strict";

const commands = require('./commands');
let program = require('commander');

program
  .option('-h, --host [hostname]', 'hostname [localhost]',"localhost")
  .parse(process.argv);

commands.list("http://" + program.host + ":3000/").then(function(idList) { console.log(idList); });
