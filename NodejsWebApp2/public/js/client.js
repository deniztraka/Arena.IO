
var playerList = [];
var currentPlayer;
var upKey;
var downKey;
var leftKey;
var rightKey;
var wKey;
var aKey;
var dKey;
var sKey;

var socket = io();

var checkMovement = function (socket) {
    if (upKey.isDown || wKey.isDown) {
        socket.emit(Constants.EventNames.OnUpKeyPressed, true);
    }
    else if (downKey.isDown || sKey.isDown) {
        socket.emit(Constants.EventNames.OnDownKeyPressed, true);
    }
    
    if (leftKey.isDown || aKey.isDown) {
        socket.emit(Constants.EventNames.OnLeftKeyPressed, true);
    }
    else if (rightKey.isDown || dKey.isDown) {
        socket.emit(Constants.EventNames.OnRightKeyPressed, true);
    }
}

var game = new Phaser.Game(300, 300, Phaser.AUTO, 'test multi game', {
    preload: function () {
        game.load.image('mushroom', '/public/assets/sprites/red_ball.png');
    }, 
    create: function () {
        var mushroom = game.cache.checkImageKey('mushroom');
        upKey = game.input.keyboard.addKey(Phaser.Keyboard.UP);
        downKey = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
        leftKey = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
        rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
        
        wKey = game.input.keyboard.addKey(Phaser.Keyboard.W);
        sKey = game.input.keyboard.addKey(Phaser.Keyboard.S);
        aKey = game.input.keyboard.addKey(Phaser.Keyboard.A);
        dKey = game.input.keyboard.addKey(Phaser.Keyboard.D);
    },
    update: function () {
        //process player rotation
        if (currentPlayer && currentPlayer.sprite) {
            currentPlayer.sprite.rotation = game.physics.arcade.angleToPointer(currentPlayer.sprite);
            socket.emit(Constants.EventNames.OnUpdateRotation, currentPlayer.sprite.rotation);
        }
        
        checkMovement(socket);
    },
    render: function () {
         
    }
});

socket.on(Constants.EventNames.Connect, function () {
    
});

socket.on(Constants.CommandNames.AlreadyLoggedInPlayerList, function (players) {
    playerList = players;
    for (var i = 0; i < playerList.length; i++) {
        var player = playerList[i];
        player.sprite = game.add.sprite(player.position.x, player.position.y, 'mushroom');
        player.sprite.anchor.setTo(0.5, 0.5);
        console.log("this should be already logged in player" + player.id);
    };
});

socket.on(Constants.CommandNames.PlayerInfo, function (player) {
    currentPlayer = player;
    currentPlayer.sprite = game.add.sprite(player.position.x, player.position.y, 'mushroom');
    currentPlayer.sprite.anchor.setTo(0.5, 0.5);
    playerList.push(currentPlayer);
    console.log("this should be me" + currentPlayer.id);
});

socket.on(Constants.CommandNames.NewLoginInfo, function (player) {
    player.sprite = game.add.sprite(player.position.x, player.position.y, 'mushroom');
    player.sprite.anchor.setTo(0.5, 0.5);
    
    playerList.push(player);
    console.log("this should be new comer" + player.id);
});

socket.on(Constants.CommandNames.DisconnectedPlayerInfo, function (disconnectedPlayer) {
    console.log("this should be disconnected user info" + disconnectedPlayer.id);
    for (var i = 0; i < playerList.length; i++) {
        var player = playerList[i];
        if (disconnectedPlayer.id == player.id) {
            player.sprite.destroy();
        }
    };
});

socket.on(Constants.CommandNames.PlayerPositionsUpdate, function (playerPositions) {
    for (var i = 0; i < playerPositions.length; i++) {
        if (playerPositions[i] != null) {
            var pos = playerPositions[i];
            
            for (var j = 0; j < playerList.length; j++) {
                var player = playerList[j];
                if (player.id == pos.id) {
                    player.sprite.position.x = pos.x;
                    player.sprite.position.y = pos.y;
                }
            };
        }
    }
});

socket.on(Constants.CommandNames.PlayerRotationsUpdate, function (playerRotations) {
    for (var i = 0; i < playerRotations.length; i++) {
        if (playerRotations[i] != null) {
            var rot = playerRotations[i];
            
            for (var j = 0; j < playerList.length; j++) {
                var player = playerList[j];
                if (player.id == rot.id) {
                    player.sprite.rotation = rot.rotation;
                }
            };
        }
    }
});