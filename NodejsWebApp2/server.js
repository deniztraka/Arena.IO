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
var Bonus = require('./server/bonus.js');

// Server props
var lastTimeSeconds;
var totalElapsedTimeFromSeconds = 0;
var bodyRemovalList = [];

// gameplay props
var damageDealtData = {};
var killCountData = {};
var activeBonusList = [];

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
    socket.on(Constants.EventNames.OnShiftKeyPressed, function (isDown) {
        onShiftKeyPressed(player, isDown);
    });
    socket.on(Constants.EventNames.OnEKeyPressed, function (isDown) {
        onEKeyPressed(player, isDown);
    });
    socket.on(Constants.CommandNames.MousePosition, function (mousePos) {
        updateRotation(player, mousePos);
    });

}

// player connect event
var onPlayerConnect = function (socket, io) {
    //firstly send already logged in playerList to the sender
    socket.emit(Constants.CommandNames.AlreadyLoggedInPlayerList, getClientPlayerList());
    socket.emit(Constants.CommandNames.CurrentBonusListInfo, getActiveBonusClientInfoList());

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

// processing user inputs
var onMouseClicked = function (player, mousePosition) {
    var canSlash = attack(player);
    if (canSlash) {
        processSlash(player, mousePosition);
    }
};

var onUpKeyPressed = function (player) {
    player.position[1] -= player.isRunning ? player.speed * serverConfig.gamePlay.runningSpeedMultiplier : player.speed;
};

var onDownKeyPressed = function (player) {
    player.position[1] += player.isRunning ? player.speed * serverConfig.gamePlay.runningSpeedMultiplier : player.speed;
};

var onLeftKeyPressed = function (player) {
    player.position[0] -= player.isRunning ? player.speed * serverConfig.gamePlay.runningSpeedMultiplier : player.speed;
};

var onRightKeyPressed = function (player) {
    player.position[0] += player.isRunning ? player.speed * serverConfig.gamePlay.runningSpeedMultiplier : player.speed;
};

var onShiftKeyPressed = function (player, isDown) {
    player.isRunning = isDown;
    if (isDown) {
        if (player.stamina > 0) {
            player.stamina -= serverConfig.gamePlay.staminaDecreaseRateWhileRunning;
        } else {
            player.isRunning = false;
            player.stamina = 0;
        }
    } else {
        player.isRunning = false;
    }
};
var onEKeyPressed = function (player, isDown) {
    if (isDown && !player.DefendMode) {
        player.SetDefendMode(true);
        world.removeConstraint(player.shieldConstraint);
        world.addConstraint(player.defendConstraint);
        player.speed = serverConfig.gamePlay.defendSpeed;
    } else if (!isDown) {
        player.SetDefendMode(false);
        world.removeConstraint(player.defendConstraint);
        world.addConstraint(player.shieldConstraint);
        player.speed = serverConfig.gamePlay.movementSpeed;
    }
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
    utils.executeByIntervalFromSeconds(totalElapsedTimeFromSeconds, serverConfig.server.gameTimeUpdateFrequencyFromSeconds, sendGameTimeToAllClients);

    lastTimeSeconds = totalElapsedTimeFromSeconds;
}, 1000 * serverConfig.server.serverProcessFrequency);

// collision checking
world.on('beginContact', function (evt) {
    var humanBody = null;
    var weaponBody = null;
    var bonusBody = null;

    //if body types are equal return
    if (evt.bodyA.bodyType == evt.bodyB.bodyType) {
        return;
    }

    //if one of body types are shield return
    if (evt.bodyA.bodyType == "shield" || evt.bodyB.bodyType == "shield") {
        return;
    }

    //if one of body types are bonus
    if (evt.bodyA.bodyType == "bonus" || evt.bodyB.bodyType == "bonus") {
        //set human and bonus body
        if (evt.bodyA.bodyType == "bonus") {
            humanBody = evt.bodyB;
            bonusBody = evt.bodyA;
        } else {
            humanBody = evt.bodyA;
            bonusBody = evt.bodyB;
        }

        bonusBody.setEffect(humanBody);
        kill(bonusBody);

        return;
    }

    //if one of body types are weapon
    if (evt.bodyA.bodyType == "weapon" || evt.bodyB.bodyType == "weapon") {

        //setting human or weapon body
        if (evt.bodyA.bodyType == "weapon") {
            if (evt.bodyA.playerId == evt.bodyB.id) {//eger silah kendininse 
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

        //processing damage
        var attacker = world.getBodyById(weaponBody.playerId);
        humanBody.health -= weaponBody.damage;
        damageDealtData[weaponBody.playerId] += weaponBody.damage;  //update player total damage dealt

        io.emit("animAttack", { x: humanBody.position[0], y: humanBody.position[1] });//sending damage dealt position for client animation - should be updated ( calculate in client )
        if (humanBody.health <= 0) {
            io.emit(Constants.CommandNames.Killed, humanBody.clientInfo);//send playerInfo to the all clients
            kill(humanBody);
            killCountData[weaponBody.playerId]++;
        }
    }
});

// core game functions
var processWorld = function (deltaTime) {
    world.step(serverConfig.server.serverProcessFrequency, deltaTime, serverConfig.server.maxSubSteps);
    clearRemovedBodies();

    utils.executeByIntervalFromSeconds(totalElapsedTimeFromSeconds, serverConfig.gamePlay.staminaIncreaseFrequencyFromSeconds, utilizeStaminaIncrease);

    utils.executeByIntervalFromSeconds(totalElapsedTimeFromSeconds, serverConfig.server.healthStaminaUpdateFrequencyFromSeconds, sendAllPlayersHealthStaminaInfo);
    utils.executeByIntervalFromSeconds(totalElapsedTimeFromSeconds, serverConfig.server.positionAndRotationUpdateFrequencyFromSeconds, sendPosRotData);
    utils.executeByIntervalFromSeconds(totalElapsedTimeFromSeconds, serverConfig.server.scoreUpdateFrequencyFromSeconds, sendAllPlayersDamageDealthInfo);
    utils.executeByIntervalFromSeconds(totalElapsedTimeFromSeconds, serverConfig.server.scoreUpdateFrequencyFromSeconds, sendAllPlayersKillCountInfo);
    utils.executeByIntervalFromSeconds(totalElapsedTimeFromSeconds, serverConfig.server.randomBonusGenerationProcess, createRandomBonuses);
};

function clearRemovedBodies() {
    if (bodyRemovalList.length > 0) {
        for (var i = 0; i < bodyRemovalList.length; i++) {
            var body = bodyRemovalList[i];
            if (body.bodyType == "human") {
                world.removeConstraint(body.weaponConstraint);
                world.removeConstraint(body.shieldConstraint);
                world.removeConstraint(body.defendConstraint);
                world.removeBody(body.weapon);
                world.removeBody(body.shield);
                world.removeBody(body);
                delete damageDealtData[body.id];
                delete killCountData[body.id];
                body.socket.disconnect();
            } else if (body.bodyType == "bonus") {                
                var bonusIndex = activeBonusList.indexOf(body);
                if (bonusIndex > -1) {
                    activeBonusList.splice(bonusIndex, 1);
                    world.removeBody(body);
                    io.emit(Constants.CommandNames.RemoveBonus, body.clientInfo);//sending bonusbody.clientInfo to all players for removing
                    logger.log(body.bonusType + " bonus is removed");
                    logger.log("active bonus list:" + activeBonusList.length);    
                }
            }            
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

var getActiveBonusClientInfoList = function () {
    var clientList = {}
    for (var key in activeBonusList) {
        var bonus = activeBonusList[key];

        clientList[key] = bonus.clientInfo;
    }
    return clientList;
}

function kill(body) {
    bodyRemovalList.push(body);
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
    utils.executeAfterSeconds(0.1, function () {
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

    var oldShieldPosition = player.shield.position;
    var oldShieldAngle = player.shield.angle;

    //This will lock weapon and shield to player    
    player.weaponConstraint = new p2.LockConstraint(player, player.weapon, { collideConnected: false });
    world.addConstraint(player.weaponConstraint);
    player.shieldConstraint = new p2.LockConstraint(player, player.shield, { collideConnected: false });

    //Set defend constraint    
    player.shield.position = [player.position[0] - 5, player.position[1] - 20];
    player.shield.angle = 0;
    player.defendConstraint = new p2.LockConstraint(player, player.shield, { collideConnected: false });

    //Add sheild constraint to world
    player.shield.position = oldShieldPosition;
    player.shield.angle = oldShieldAngle;
    world.addConstraint(player.shieldConstraint);


    //assign damage dealt and killCount data of player
    damageDealtData[player.id] = 0;
    killCountData[player.id] = 0;
    return player;
}

function utilizeStaminaIncrease() {
    for (var i = 0; i < world.bodies.length; i++) {
        var body = world.bodies[i];
        if (body.bodyType == "human") {
            var player = body
            if (player.stamina <= 100) {
                player.stamina += serverConfig.gamePlay.staminaIncreaseRate;
            }
        }
    }
}
function createRandomBonuses() {
    if (activeBonusList.length < serverConfig.gamePlay.maxActiveBonusCount) {
        if (utils.random(0, 100) < 1) {
            //get random bonus type
            var bonusType = serverConfig.gamePlay.bonusTypes[utils.randomInt(0, serverConfig.gamePlay.bonusTypes.length)];
            //add to world
            addBonusToWorld(new Bonus(bonusType));
            logger.log(bonusType + " bonus is created");
            logger.log("active bonus list:" + activeBonusList.length);
        } 
    }
}

function addBonusToWorld(bonus) {
    world.addBody(bonus);
    activeBonusList.push(bonus);
    io.emit(Constants.CommandNames.CreateBonus, bonus.clientInfo);       
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

var sendAllPlayersHealthStaminaInfo = function () {
    var allHealthStaminaData = {};
    for (var i = 0; i < world.bodies.length; i++) {
        var body = world.bodies[i];
        if (body.isBodyAlive) {
            var player = body;
            allHealthStaminaData[player.id] = {
                health: Math.floor(player.health),
                stamina: Math.floor(player.stamina)
            }
        }
    }
    io.emit(Constants.CommandNames.HealthStaminaUpdate, allHealthStaminaData);
};

var sendAllPlayersDamageDealthInfo = function () {
    io.emit(Constants.CommandNames.DamageDealtUpdate, damageDealtData);
};

var sendAllPlayersKillCountInfo = function () {
    io.emit(Constants.CommandNames.KillCountUpdate, killCountData);
};

var sendGameTimeToAllClients = function () {
    io.emit("tick", Math.floor(totalElapsedTimeFromSeconds));
};