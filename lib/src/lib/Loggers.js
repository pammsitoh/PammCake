const colors = require('colors');

const logger = {
    Log: ( message ) => {
        console.log(message.cyan);
    },
    Error: ( error ) => {
        console.log(error.red);
    },
    Success: ( message ) => {
        console.log(message.green)
    }
}

module.exports = logger;