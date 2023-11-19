class cakeFunction {
    constructor(){
        this.base = [];
    }

    /** @returns {String} */
    getBase() {
        return this.base.join(`\n`);
    }

    /** @param {String} command */
    addCommand( command ) {
        this.base.push(command);
    }
}

module.exports = cakeFunction;