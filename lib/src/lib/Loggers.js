const colors = require('colors');

/**
 * 
 * @param {String} message 
 */
const Log = ( message ) => {
    console.log(message.cyan);
}

/**
 * 
 * @param {String} error
 */
const Error = ( error ) => {
    console.log(error.red);
}

/**
 * 
 * @param {String} message 
 */
const Success = ( message ) => {
    console.log(message.green)
}

module.exports = {
    Log,
    Error,
    Success,
}