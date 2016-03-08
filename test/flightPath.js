"use strict";

const commands = require('./commands');
let program = require('commander');

program
  .option('-h, --host [hostname]', 'hostname [localhost]',"localhost")
  .option('-i, --id [id]', 'id of GPS source []')
  .option('-n, --num [num]', 'flightNumber []')
  .parse(process.argv);

commands.flightPath("http://" + program.host + ":3000/",program.id,program.num).then(function(path) { console.log(JSON.stringify(path,null,2)); });
