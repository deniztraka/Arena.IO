var serverConfig = require('./core/serverConfig.js');
var p2 = require('p2');
var bonus = function (type) { 
    function getBonusColor(pBonusType) {
        if (pBonusType == "health") {
            return "#ff0000";//red
        } else if (pBonusType == "stamina") {
            return "#00aaff";//blue
        }
    }
    this.isBodyAlive = false;
    this.bonusType = type;
    this.bodyType = "bonus";
    p2.Body.call(this, {
        mass: 1,
        position: [Math.floor(1920 * Math.random()), Math.floor(1920 * Math.random())],
        type: p2.Body.DYNAMIC
    });
    this.damping = 1;

    var bonusShape = new p2.Circle({ radius: 10 });
    bonusShape.collisionGroup = Math.pow(2, 0);
    bonusShape.collisionMask = Math.pow(2, 0);
    this.addShape(bonusShape); 

    this.setEffect = function(playerBody){
        if (this.bonusType == "health") {            
            playerBody.health += 40;
            if (playerBody.health > 100) {
                playerBody.health = 100;
            }
        } else if (this.bonusType == "stamina") {
            playerBody.stamina += 20;
            if (playerBody.stamina > 100) {
                playerBody.healthstamina = 100;
            }
        }
    };

    this.clientInfo = {
        id: this.id,
        position: {
            x: this.position[0],
            y: this.position[1]
        },
        type: this.bonusType,
        color: getBonusColor(this.bonusType)      
    };
};

bonus.prototype = Object.create(p2.Body.prototype);

module.exports = bonus;