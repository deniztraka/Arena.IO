var p2 = require('p2');
var player = function (socket) {
    function getWeaponInfo() {
        if (this.weapon) { 
            return this.weapon.clientInfo;
        }
    }
    
    function getShieldInfo() {
        if (this.shield) {
            return this.shield.clientInfo;
        }
    }
    
    this.socket = socket;
    this.id = Math.floor(100 * Math.random());
    this.nickname = socket.handshake.query["nickname"];
    this.client = { sessionId : socket.id };
    this.color = '#' + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6);
    this.health = 100;
    this.nextAttackTime = 0;
    this.bodyType = "human";    
    p2.Body.call(this, {
        mass: 1,
        position: [Math.floor(300 * Math.random()), Math.floor(300 * Math.random())],
        type: p2.Body.DYNAMIC
    });
    this.damping = 1;
    this.isBodyAlive = true;

    var playerShape = new p2.Circle({ radius: 10 });
    playerShape.collisionGroup = Math.pow(2, 0);
    playerShape.collisionMask = Math.pow(2, 0);
    this.addShape(playerShape);    

    this.clientInfo = {
        id: this.id,
        sessionId: this.client.sessionId,
        position : {
            x: this.interpolatedPosition[0],
            y: this.interpolatedPosition[1]
        },
        color: this.color,
        health:this.health,
        nickname: this.nickname,
        weapon : getWeaponInfo(),
        shield : getShieldInfo()
    };
};

player.prototype = Object.create(p2.Body.prototype);

module.exports = player;