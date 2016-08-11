var p2 = require('p2');
var weapon = function (socket, playerPosition, playerId) {
    var armLength = 10 * 2;
    var armHeight = armLength * 0.1;

    this.playerId = playerId;
    this.damage = 5;    
    p2.Body.call(this, {
        mass : 0.00000001,
        position : [playerPosition[0] + 10, playerPosition[1]-5],
        angle : -1.5707963268  
    });    
    this.isBodyAlive = false;
    
    var armShape = new p2.Box({
        width : armLength,
        height : armHeight
    });
    this.addShape(armShape);    

    this.clientInfo = {
        playerId: this.playerId,
        rotation: this.angle,        
        position : {
            x: this.position[0],
            y: this.position[1]
        }
    };    
};

weapon.prototype = Object.create(p2.Body.prototype);

module.exports = weapon;