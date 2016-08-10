var express = require('express');
var app = express();
var serv = require('http').Server(app);
var Constants = require('./shared/js/common/constants.js');
var io = require('socket.io')(serv, {});
var p2 = require('p2');
var Player = require('./server/player.js');
var Weapon = require('./server/weapon.js');

var world = new p2.World({
    gravity: [0, 0]
});

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});
app.use('/public', express.static(__dirname + '/public'));
app.use('/shared', express.static(__dirname + '/shared'));
serv.listen(process.env.port || 1337, function (s) {

});


io.on(Constants.EventNames.Connection, function (socket) {
    onPlayerConnect(socket, io);
});

var onPlayerDisconnect = function (player, socket) {
    console.log('user is disconnected. id:' + player.id);
    socket.broadcast.emit(Constants.CommandNames.DisconnectedPlayerInfo, player.clientInfo);//send playerInfo to the all clients except sender
    world.removeConstraint(player.weaponConstraint);
    world.removeBody(player.weapon);
    world.removeBody(player);
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

function processSlash() {
    var maxSlashDistance = 30;
    
    var xDistance = (mousePos.x - characterBody.position[0]);
    var yDistance = (mousePos.y - characterBody.position[1]);
    //var d = Math.sqrt(Math.pow(xDistance,2) + Math.pow(yDistance,2));
    /*var slashPower = d * 0.3;
      	console.log(d);*/

      	if (xDistance > maxSlashDistance) {
        xDistance = maxSlashDistance;
    } else if (xDistance < -maxSlashDistance) {
        xDistance = -maxSlashDistance
    }
    
    if (yDistance > maxSlashDistance) {
        yDistance = maxSlashDistance;
    } else if (yDistance < -maxSlashDistance) {
        yDistance = -maxSlashDistance
    }
    
    armBody.position[0] = armBody.position[0] + xDistance;
    armBody.position[1] = armBody.position[1] + yDistance;
};

var onMouseClicked = function (player,mousePosition) {
    console.log(player.nickname + " is clicked. x:" +mousePosition.x + " y:" + mousePosition.y);
    //player.applyForce([0, -speed]);
};

var onUpKeyPressed = function (player) {
    player.position[1]--;
    //player.applyForce([0, -speed]);
};

var onDownKeyPressed = function (player) {
    player.position[1]++;
    //player.applyForce([0, speed]);
};

var onLeftKeyPressed = function (player) {
    player.position[0]--;
    //player.applyForce([-speed, 0]);
};

var onRightKeyPressed = function (player) {
    player.position[0]++;
    //player.applyForce([speed, 0]);
};

var onUpdateRotation = function (player, rotation) {
    player.angle = rotation;
};

var updateRotation = function (player, mousePosition) {    
    player.angle = Math.atan2(mousePosition.x - player.weapon.position[0], -(mousePosition.y - player.weapon.position[1]));
};

var onPlayerConnect = function (socket, io) {
    //send playerList to the sender
    socket.emit(Constants.CommandNames.AlreadyLoggedInPlayerList, getClientPlayerList());
    
    var player = new Player(socket);
    player.weapon = new Weapon(socket, player.position, player.id);     
    world.addBody(player.weapon);   
    world.addBody(player);           

     //This will lock weapon to player
    player.weaponConstraint = new p2.LockConstraint(player, player.weapon, { collideConnected: false });
    world.addConstraint(player.weaponConstraint);
    
    console.log('a user is connected. id:' + player.id);
    
    socket.on(Constants.EventNames.OnPlayerDisconnect, function () {
        onPlayerDisconnect(player, socket);
    });//Player disconnected event
    socket.emit(Constants.CommandNames.PlayerInfo, player.clientInfo);//send playerInfo to the sender
    socket.broadcast.emit(Constants.CommandNames.NewLoginInfo, player.clientInfo);//send playerInfo to the all clients except sender
    
    //Mouse events
    socket.on(Constants.EventNames.OnMouseClicked, function (mousePosition) {
        onMouseClicked(player, mousePosition);
    });
    
    //Movement events
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
        updateRotation(player,mousePos);
    });
};

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
                    x: player.weapon.clientInfo.position.x,
                    y: player.weapon.clientInfo.position.y
                }
            };
        }
    };
    
    io.emit(Constants.CommandNames.PlayerPosRotUpdate, playerPosRotData);
};

var lastTimeSeconds;
var totalElapsedTimeFromSeconds = 0;
var serverProcessFrequency = 1 / 60;
var gameTimeUpdateFrequencyFromSeconds = 1;
var positionAndRotationUpdateFrequencyFromSeconds = 1 / 30;

var maxSubSteps = 10;

//Main Game Loop
setInterval(function () {
    totalElapsedTimeFromSeconds += serverProcessFrequency;
    deltaTime = totalElapsedTimeFromSeconds - lastTimeSeconds;
    
    processWorld();
    
    //Sending elapsed game time to all clients
    executeByIntervalFromSeconds(gameTimeUpdateFrequencyFromSeconds, sendGameTimeToAllClients);
    lastTimeSeconds = totalElapsedTimeFromSeconds;
}, 1000 * serverProcessFrequency);

var executeByIntervalFromSeconds = function (frequency, functionToProcess) {
    var mod = totalElapsedTimeFromSeconds % frequency;
    if (mod < serverProcessFrequency) {
        functionToProcess();
    }
}

var processWorld = function () {
    // The step method moves the bodies forward in time.
    world.step(serverProcessFrequency, deltaTime, maxSubSteps);
    executeByIntervalFromSeconds(positionAndRotationUpdateFrequencyFromSeconds, sendPosRotData);
    //sendPosRotData();
};

world.on('beginContact', function (evt) {
    if (evt.bodyA.isBodyAlive && !evt.bodyB.isBodyAlive) {
        console.log("yes");
    }
});

var sendGameTimeToAllClients = function () {
    io.emit("tick", Math.floor(totalElapsedTimeFromSeconds));
}
