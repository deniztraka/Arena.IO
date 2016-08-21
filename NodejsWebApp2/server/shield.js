var p2 = require('p2');
var shield = function (socket, playerPosition, playerId) {
    var shieldLength = 15 * 2;
    var shieldHeight = shieldLength * 0.25;

    this.playerId = playerId;    
    p2.Body.call(this, {
        mass : 0.0001,
        position : [playerPosition[0] - 20, playerPosition[1]],
        angle : -1.5707963268  
    });    
    this.isBodyAlive = false;
    this.bodyType = "shield";
    
    var shieldShape = new p2.Box({
        width : shieldLength,
        height : shieldHeight
    });
    this.addShape(shieldShape);    

    this.clientInfo = {
        playerId: this.playerId,
        rotation: this.angle,        
        position : {
            x: this.position[0],
            y: this.position[1]
        }
    };    
};

shield.prototype = Object.create(p2.Body.prototype);

module.exports = shield;