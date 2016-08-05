
var playerList = {};
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
        currentPlayer.sprite.position.y--;
    }
    else if (downKey.isDown || sKey.isDown) {
        socket.emit(Constants.EventNames.OnDownKeyPressed, true);
        currentPlayer.sprite.position.y++;
    }

    if (leftKey.isDown || aKey.isDown) {
        socket.emit(Constants.EventNames.OnLeftKeyPressed, true);
        currentPlayer.sprite.position.x--;
    }
    else if (rightKey.isDown || dKey.isDown) {
        socket.emit(Constants.EventNames.OnRightKeyPressed, true);
        currentPlayer.sprite.position.x++;
    }
}

var game = new Phaser.Game(300, 300, Phaser.AUTO, 'test multi game', {
    preload: function () {
        game.time.advancedTiming = true;
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
        game.debug.text(game.time.fps || '--', 2, 14, "#00ff00"); 
    }
});


var createSocketEvents = function () {
    socket = io(window.location.origin, { query: 'nickname=user' + Math.floor(1000 * Math.random()) });
    socket.on(Constants.EventNames.Connect, function () {

    });

    socket.on(Constants.CommandNames.AlreadyLoggedInPlayerList, function (players) {
        playerList = players;
        for (var id in playerList) {
            var player = playerList[id];
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

        playerList[currentPlayer.id] = currentPlayer;
        console.log("this should be me and my nickname is " + currentPlayer.nickname + " and my id is " + currentPlayer.id);
    });

    socket.on(Constants.CommandNames.NewLoginInfo, function (player) {
        player.sprite = game.add.sprite(player.position.x, player.position.y, 'mushroom');
        player.sprite.anchor.setTo(0.5, 0.5);
        style.fill = player.color;
        player.nicknameText = game.add.text(0, 0, player.nickname, style);
        player.nicknameText.anchor.set(0.5);
        playerList[player.id] = player;
        console.log("this should be new comer and its id is " + player.id + " nickname is " + player.nickname);
    });

    socket.on(Constants.CommandNames.DisconnectedPlayerInfo, function (disconnectedPlayer) {
        console.log("this should be disconnected user info" + disconnectedPlayer.id);
        playerList[disconnectedPlayer.id].nicknameText.destroy();
        playerList[disconnectedPlayer.id].sprite.destroy();
        delete playerList[disconnectedPlayer.id];        
    });

    socket.on(Constants.CommandNames.PlayerPosRotUpdate, function (playersData) {
        for (var id in playersData) {
            var data = playersData[id];
            var player = playerList[id];

            if (player.sprite) {
                player.sprite.rotation = data.rotation;

                if (player.sprite.position) {
                    //position update
                    player.sprite.position.x = data.x;
                    player.sprite.position.y = data.y;

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
    });
};

