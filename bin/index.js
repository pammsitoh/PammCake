#!/usr/bin/env node

const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

yargs(hideBin(process.argv))
    .commandDir('./commands')
    .demandCommand(1, 'Debes proporcionar un comando válido.')
    .help()
    .version(false)
    .argv;
