Object.size = function (obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};
var serverConfig = require('../core/serverConfig.js');
module.exports = {
    getDateTimeText: function () {
        var date = new Date();
        
        var hour = date.getHours();
        hour = (hour < 10 ? "0" : "") + hour;
        
        var min = date.getMinutes();
        min = (min < 10 ? "0" : "") + min;
        
        var sec = date.getSeconds();
        sec = (sec < 10 ? "0" : "") + sec;
        
        var year = date.getFullYear();
        
        var month = date.getMonth() + 1;
        month = (month < 10 ? "0" : "") + month;
        
        var day = date.getDate();
        day = (day < 10 ? "0" : "") + day;
        
        return year + "." + month + "." + day + " " + hour + ":" + min + ":" + sec;
    },    
    executeAfterSeconds : function (seconds, executeFunction) {
        setTimeout(function () { executeFunction() }, seconds * 1000);
    },    
    executeByIntervalFromSeconds : function (totalElapsedTimeFromSeconds, frequency, functionToProcess) {
        var mod = totalElapsedTimeFromSeconds % frequency;
        if (mod < serverConfig.server.serverProcessFrequency) {
            functionToProcess();
        }
    },
    //This function generates floating-point between two numbers low (inclusive) and high (exclusive)([low, high))
    random: function random(low, high) {
        return Math.random() * (high - low) + low;
    },
    //This function generates random integer between two numbers low (inclusive) and high (exclusive) ([low, high))
    randomInt : function (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
    },
    //This function generates random integer between two numbers low (inclusive) and high (inclusive) ([low, high])
    randomIntInc : function  (low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
    }
};