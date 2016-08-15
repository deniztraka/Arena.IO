var utils = require('./utils.js');

module.exports = {
    log: function (message) { 
        console.log(utils.getDateTimeText() + " || " + message);
    }
};