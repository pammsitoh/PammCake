const colors = require('colors');

const logo = `${'▞'.cyan} PCake ${'▞'.magenta}`;

const logger = {
    Log: ( message ) => {
        console.log(`${logo} ${message.cyan}`);
    },
    Warn: ( message ) => {
        console.log(`${logo} ${message.yellow}`);
    },
    Error: ( error ) => {
        console.log(`${logo} ${error.red}`);
    },
    Success: ( message ) => {
        console.log(`${logo} ${message.green}`);
    }
}

module.exports = logger;