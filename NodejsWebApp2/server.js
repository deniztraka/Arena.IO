var express = require('express');
var app = express();
var serv = require('http').Server(app);
var Constants = require('./shared/js/common/constants.js');
var io = require('socket.io')(serv, {});
var p2 = require('p2');
var Player = require('./server/player.js');

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
    world.removeBody(player);
};

var getClientPlayerList = function () {
    var clientList = {};
    for (var i = 0; i < world.bodies.length; i++) {
        var player = world.bodies[i];
        clientList[player.id] = player.clientInfo;
    };
    return clientList;
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

var onPlayerConnect = function (socket, io) {
    //send playerList to the sender
    socket.emit(Constants.CommandNames.AlreadyLoggedInPlayerList, getClientPlayerList());

    var player = new Player(socket);
    world.addBody(player);

    console.log('a user is connected. id:' + player.id);

    socket.on(Constants.EventNames.OnPlayerDisconnect, function () {
        onPlayerDisconnect(player, socket);
    });
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
    socket.on(Constants.EventNames.OnUpdateRotation, function (rotation) {
        onUpdateRotation(player, rotation);
    });

    socket.emit(Constants.CommandNames.PlayerInfo, player.clientInfo);//send playerInfo to the sender

    socket.broadcast.emit(Constants.CommandNames.NewLoginInfo, player.clientInfo);//send playerInfo to the all clients except sender
};

var sendPosRotData = function () {
    var playerPosRotData = {};

    for (var i = 0; i < world.bodies.length; i++) {
        var player = world.bodies[i];

        playerPosRotData[player.id] = { x: player.position[0], y: player.position[1], id: player.id, rotation: player.angle };
    };

    io.emit(Constants.CommandNames.PlayerPosRotUpdate, playerPosRotData);
};

var timeStep = 1 / 1;
// The "Game loop". Could be replaced by, for example, requestAnimationFrame. 
setInterval(function () {

    // The step method moves the bodies forward in time.
    world.step(timeStep);

    sendPosRotData();
}, 1000 * timeStep);