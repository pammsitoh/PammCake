#!/usr/bin/env node

const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const colors = require("colors");
const fs = require("fs");
const pckg_json = require('../package.json');

yargs(hideBin(process.argv))
  .commandDir('./commands')  // Nota: Asegúrate de que la ruta es correcta
  .demandCommand(1, 'Debes proporcionar un comando válido.')
  .help()
  .version(false)
  .argv;
