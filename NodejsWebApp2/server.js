var serverConfig = require('./server/core/serverConfig.js');
var utils = require('./server/utils/utils.js');
var logger = require('./server/utils/logger.js');
var express = require('express');
var app = express();
var serv = require('http').Server(app);
var Constants = require('./shared/js/common/constants.js');
var io = require('socket.io')(serv, {});
var p2 = require('p2');

var Player = require('./server/player.js');
var Weapon = require('./server/weapon.js');
var Shield = require('./server/shield.js');

// Server props
var lastTimeSeconds;
var totalElapsedTimeFromSeconds = 0;

// Data sync update frequency constants
var gameTimeUpdateFrequencyFromSeconds = 1;
var healthUpdateFrequencyFromSeconds = 1 / 10;
var positionAndRotationUpdateFrequencyFromSeconds = 1 / 30;
var damageDealtUpdateFrequencyFromSeconds = 1;

// gameplay props
var damageDealtData = {};
var bodyRemovalList = [];

// creating world
var world = new p2.World({
    gravity: [0, 0]
});

// opening server
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});
app.use('/public', express.static(__dirname + '/public'));
app.use('/shared', express.static(__dirname + '/shared'));
serv.listen(process.env.port || 5009, function (s) {

});

io.on(Constants.EventNames.Connection, function (socket) {
    onPlayerConnect(socket, io);
});

// player connect event
var onPlayerConnect = function (socket, io) {
    //firstly send already logged in playerList to the sender
    socket.emit(Constants.CommandNames.AlreadyLoggedInPlayerList, getClientPlayerList());
    
    //player is created
    var player = createPlayer(socket);
    logger.log(player.nickname + " is joined the server.");
    
    //send playerInfo to the sender
    socket.emit(Constants.CommandNames.PlayerInfo, player.clientInfo);
    
    //send playerInfo to the all clients except sender
    socket.broadcast.emit(Constants.CommandNames.NewLoginInfo, player.clientInfo);
    
    attachEvents(socket, player);
};

// player disconnect event
var onPlayerDisconnect = function (player, socket) {
    logger.log(player.nickname + " is disconnected from server.");
    socket.broadcast.emit(Constants.CommandNames.DisconnectedPlayerInfo, player.clientInfo);//send playerInfo to the all clients except sender
    kill(player);
};

// attaching events
function attachEvents(socket, player) {
    //attach player disconnected event
    socket.on(Constants.EventNames.OnPlayerDisconnect, function () {
        onPlayerDisconnect(player, socket);
    });
    
    //attach mouse events
    socket.on(Constants.EventNames.OnMouseClicked, function (mousePosition) {
        onMouseClicked(player, mousePosition);
    });
    
    //attach movement events
    socket.on(Constants.EventNames.OnUpKeyPressed, function () {
        onUpKeyPressed(player);
    });
    socket.on(Constants.EventNames.OnDownKeyPressed, function () {
        onDownKeyPressed(player);
    });
    socket.on(Constants.EventNames.OnLeftKeyPressed, function () {
        onLeftKeyPressed(player);
    });
    socket.on(Constants.EventNames.OnRightKeyPressed, function () {
        onRightKeyPressed(player);
    });
    socket.on(Constants.CommandNames.MousePosition, function (mousePos) {
        updateRotation(player, mousePos);
    });
}

// handling user inputs
var onMouseClicked = function (player, mousePosition) {
    var canSlash = attack(player);
    if (canSlash) {
        processSlash(player, mousePosition);
    }
};

var onUpKeyPressed = function (player) {
    player.position[1]--;
};

var onDownKeyPressed = function (player) {
    player.position[1]++;
};

var onLeftKeyPressed = function (player) {
    player.position[0]--;
};

var onRightKeyPressed = function (player) {
    player.position[0]++;
};

var updateRotation = function (player, mousePosition) {
    player.angle = Math.atan2(mousePosition.x - player.weapon.position[0], -(mousePosition.y - player.weapon.position[1]));
};

// main Game Loop
setInterval(function () {
    totalElapsedTimeFromSeconds += serverConfig.server.serverProcessFrequency;
    deltaTime = totalElapsedTimeFromSeconds - lastTimeSeconds;
    
    processWorld(deltaTime);
    
    //Sending elapsed game time to all clients
    executeByIntervalFromSeconds(serverConfig.server.gameTimeUpdateFrequencyFromSeconds, sendGameTimeToAllClients);
    
    lastTimeSeconds = totalElapsedTimeFromSeconds;
}, 1000 * serverConfig.server.serverProcessFrequency);

// collision checking
world.on('beginContact', function (evt) {
    var humanBody = null;
    var weaponBody = null;
    if (evt.bodyA.bodyType == evt.bodyB.bodyType || (evt.bodyA.bodyType == "shield" || evt.bodyB.bodyType == "shield")) {
        return;
    }
    
    if (evt.bodyA.bodyType == "weapon") {
        if (evt.bodyA.playerId == evt.bodyB.id) {
            return;
        } else {
            weaponBody = evt.bodyA;
            humanBody = evt.bodyB;
        }
    } else if (evt.bodyB.bodyType == "weapon") {
        if (evt.bodyB.playerId == evt.bodyA.id) {
            return;
        } else {
            weaponBody = evt.bodyB;
            humanBody = evt.bodyA;
        }
    }
    
    var attacker = world.getBodyById(weaponBody.playerId);          
    humanBody.health -= weaponBody.damage;
    damageDealtData[weaponBody.playerId] += weaponBody.damage;  //update player total damage dealt
    
    io.emit("animAttack", { x: humanBody.position[0], y: humanBody.position[1] });//sending damage dealt position for client animation - should be updated ( calculate in client )
    if (humanBody.health <= 0) {
        io.emit(Constants.CommandNames.Killed, humanBody.clientInfo);//send playerInfo to the all clients
        kill(humanBody);
    }    
});

// core game functions
var processWorld = function (deltaTime) {
    world.step(serverConfig.server.serverProcessFrequency, deltaTime, serverConfig.server.maxSubSteps);
    clearRemovedBodies();
    executeByIntervalFromSeconds(serverConfig.server.healthUpdateFrequencyFromSeconds, sendAllPlayersHealthInfo);
    executeByIntervalFromSeconds(serverConfig.server.positionAndRotationUpdateFrequencyFromSeconds, sendPosRotData);
    //executeByIntervalFromSeconds(damageDealtUpdateFrequencyFromSeconds, sendAllPlayersDamageDealthInfo);
};

function clearRemovedBodies() {
    if (bodyRemovalList.length > 0) {
        for (var i = 0; i < bodyRemovalList.length; i++) {
            var body = bodyRemovalList[i];
            world.removeConstraint(body.weaponConstraint);
            world.removeConstraint(body.shieldConstraint);
            world.removeBody(body.weapon);
            world.removeBody(body.shield);
            world.removeBody(body);
            body.socket.disconnect();
        }
        bodyRemovalList = [];
    }
};

var getClientPlayerList = function () {
    var clientList = {};
    for (var i = 0; i < world.bodies.length; i++) {
        var body = world.bodies[i];
        if (body.isBodyAlive) {
            var player = body;
            clientList[player.id] = player.clientInfo;
        }
    };
    return clientList;
};

function kill(playerBody) {
    bodyRemovalList.push(playerBody);
}

function attack(player, mousePosition) {
    if (totalElapsedTimeFromSeconds > player.nextAttackTime) {
        player.nextAttackTime = totalElapsedTimeFromSeconds + serverConfig.gamePlay.slashRate;
        return true;
    } else {
        return false;
    }
}

function processSlash(player, mousePosition) {
    world.removeConstraint(player.weaponConstraint);
    player.weapon.applyForceLocal([player.weapon.mass * 20000, 0]);
    executeAfterSeconds(0.1, function () {
        world.addConstraint(player.weaponConstraint)
    });
};

function createPlayer(socket) {
    var player = new Player(socket);
    player.weapon = new Weapon(socket, player.position, player.id);
    player.shield = new Shield(socket, player.position, player.id);
    world.addBody(player.weapon);
    world.addBody(player.shield);
    world.addBody(player);
    
    //This will lock weapon and shield to player
    player.weaponConstraint = new p2.LockConstraint(player, player.weapon, { collideConnected: false });
    world.addConstraint(player.weaponConstraint);
    player.shieldConstraint = new p2.LockConstraint(player, player.shield, { collideConnected: false });
    world.addConstraint(player.shieldConstraint);
    
    //assign damage dealt data of player
    damageDealtData[player.id] = 0;
    return player;
}

// update functions
var sendPosRotData = function () {
    var playerPosRotData = {};
    
    for (var i = 0; i < world.bodies.length; i++) {
        var body = world.bodies[i];
        if (body.isBodyAlive) {
            var player = body;
            
            playerPosRotData[player.id] = {
                x: player.interpolatedPosition[0], 
                y: player.interpolatedPosition[1], 
                id: player.id, 
                rotation: player.interpolatedAngle,
                weapon: {
                    x: player.weapon.interpolatedPosition[0],
                    y: player.weapon.interpolatedPosition[1],
                    rotation: player.weapon.interpolatedAngle
                },
                shield: {
                    x: player.shield.interpolatedPosition[0],
                    y: player.shield.interpolatedPosition[1],
                    rotation: player.shield.interpolatedAngle
                }
            };
        }
    };
    
    io.emit(Constants.CommandNames.PlayerPosRotUpdate, playerPosRotData);
};

var sendAllPlayersHealthInfo = function () {
    var allHealthList = {};
    for (var i = 0; i < world.bodies.length; i++) {
        var body = world.bodies[i];
        if (body.isBodyAlive) {
            var player = body;
            allHealthList[player.id] = player.health;
        }
    }
    io.emit(Constants.CommandNames.HealthUpdate, allHealthList);
};

var sendAllPlayersHealthInfo = function () {
    var allHealthList = {};
    for (var i = 0; i < world.bodies.length; i++) {
        var body = world.bodies[i];
        if (body.isBodyAlive) {
            var player = body;
            allHealthList[player.id] = player.health;
        }
    }
    io.emit(Constants.CommandNames.HealthUpdate, allHealthList);
};

var sendAllPlayersDamageDealthInfo = function () {    
    io.emit(Constants.CommandNames.DamageDealtUpdate, damageDealtData);
};

var sendGameTimeToAllClients = function () {
    io.emit("tick", Math.floor(totalElapsedTimeFromSeconds));
};

// core util functions
var executeAfterSeconds = function (seconds, executeFunction) {
    setTimeout(function () { executeFunction() }, seconds * 1000);
};

var executeByIntervalFromSeconds = function (frequency, functionToProcess) {
    var mod = totalElapsedTimeFromSeconds % frequency;
    if (mod < serverConfig.server.serverProcessFrequency) {
        functionToProcess();
    }
};
