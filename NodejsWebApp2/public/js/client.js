
var playerList = [];
var currentPlayer;
var tempLocalPlayer = {};
var upKey;
var downKey;
var leftKey;
var rightKey;
var wKey;
var aKey;
var dKey;
var sKey;
var socket;
var style;



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
        style = { font: "10px Arial", fill: "#ff0044", wordWrap: true, wordWrapWidth: 80, align: "center" };

        
    }, 
    create: function () {
        var mushroom = game.cache.checkImageKey('mushroom');

        tempLocalPlayer.sprite = game.add.sprite(0, 0, 'mushroom');
        tempLocalPlayer.sprite.anchor.setTo(0.5, 0.5);

        upKey = game.input.keyboard.addKey(Phaser.Keyboard.UP);
        downKey = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
        leftKey = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
        rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
        
        wKey = game.input.keyboard.addKey(Phaser.Keyboard.W);
        sKey = game.input.keyboard.addKey(Phaser.Keyboard.S);
        aKey = game.input.keyboard.addKey(Phaser.Keyboard.A);
        dKey = game.input.keyboard.addKey(Phaser.Keyboard.D);

        
        createSocketEvents();
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


var createSocketEvents = function () {
    socket = io(window.location.origin, { query: 'nickname=user' + Math.floor(1000 * Math.random()) });
    socket.on(Constants.EventNames.Connect, function () {

    });

    socket.on(Constants.CommandNames.AlreadyLoggedInPlayerList, function (players) {
        playerList = players;
        for (var i = 0; i < playerList.length; i++) {
            var player = playerList[i];
            player.sprite = game.add.sprite(player.position.x, player.position.y, 'mushroom');
            player.sprite.anchor.setTo(0.5, 0.5);
            style.fill = player.color;
            player.nicknameText = game.add.text(0, 0, player.nickname, style);
            player.nicknameText.anchor.set(0.5);
            console.log("this should be already logged in player" + player.id);
        };
    });

    socket.on(Constants.CommandNames.PlayerInfo, function (player) {
        currentPlayer = player;
        currentPlayer.sprite = tempLocalPlayer.sprite;
        style.fill = currentPlayer.color;
        currentPlayer.nicknameText = game.add.text(0, 0, player.nickname, style);
        currentPlayer.nicknameText.anchor.set(0.5);

        playerList.push(currentPlayer);
        console.log("this should be me and my nickname is " + currentPlayer.nickname + " and my id is " + currentPlayer.id);
    });

    socket.on(Constants.CommandNames.NewLoginInfo, function (player) {
        player.sprite = game.add.sprite(player.position.x, player.position.y, 'mushroom');
        player.sprite.anchor.setTo(0.5, 0.5);
        style.fill = player.color;
        player.nicknameText = game.add.text(0, 0, player.nickname, style);
        player.nicknameText.anchor.set(0.5);
        playerList.push(player);
        console.log("this should be new comer and its id is " + player.id + " nickname is " + player.nickname);
    });

    socket.on(Constants.CommandNames.DisconnectedPlayerInfo, function (disconnectedPlayer) {
        console.log("this should be disconnected user info" + disconnectedPlayer.id);
        for (var i = 0; i < playerList.length; i++) {
            var player = playerList[i];
            if (disconnectedPlayer.id == player.id) {
                player.nicknameText.destroy();
                player.sprite.destroy();
                playerList.splice(i,1);
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
                        if (player.sprite) {
                            if (player.sprite.position) {
                                //position update
                                player.sprite.position.x = pos.x;
                                player.sprite.position.y = pos.y;

                                //nickname text position update
                                player.position.x = player.sprite.position.x;
                                player.position.y = player.sprite.position.y;

                                if (player.nicknameText) {
                                    player.nicknameText.x = Math.floor(player.position.x);
                                    player.nicknameText.y = Math.floor(player.position.y - player.sprite.height * 0.75);
                                }
                            }
                        }
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
                        if (player.sprite) {
                            
                                player.sprite.rotation = rot.rotation;
                            
                        }
                    }
                };
            }
        }
    });
};

