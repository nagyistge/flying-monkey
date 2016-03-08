"use strict";

const commands = require('./commands');
let program = require('commander');

program
  .option('-h, --host [hostname]', 'hostname [localhost]',"localhost")
  .option('-i, --id [id]', 'id of GPS source []')
  .parse(process.argv);

commands.archive("http://" + program.host + ":3000/",program.id);
