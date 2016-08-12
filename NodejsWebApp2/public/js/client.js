
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
var totalGameTimeInSeconds = 0;
var gameTimeText;

var manager = null;
var emitter = null;
var circle = null;

var buildGameTimeText = function (totalGameTimeFromSeconds) {
    
    //Todo : Get time string hh:mm:ss
    var seconds = totalGameTimeFromSeconds % 60;
    var minutes = Math.floor(totalGameTimeFromSeconds / 60);
    var hours = Math.floor(minutes / 60);
    
    return hours + ':' + minutes + ':' + seconds;
};

function kill(player) {
    playerList[player.id].nicknameText.destroy();
    playerList[player.id].sprite.destroy();
    playerList[player.id].weapon.destroy();
    delete playerList[player.id];
}

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

var attackRate = 250;
var nextAttack = 0;
function attack() {
    if (game.time.now > nextAttack) {
        nextAttack = game.time.now + attackRate;
        console.log("aatsasd");
        socket.emit(Constants.EventNames.OnMouseClicked, { x: game.input.mousePointer.x, y: game.input.mousePointer.y });
    }
}

var checkActions = function (socket) {
    game.input.activePointer.leftButton.onDown.add(function () {
        attack(socket); 
        
    }, this);    
};

function particleBurst(pointer) {
    
    //  Position the emitter where the mouse/touch event was
    emitter.x = pointer.x;
    emitter.y = pointer.y;

    emitter.setScale(0.1, 0.001, 0.1, 0.001, 750, Phaser.Easing.Quintic.Out);
    
    //  The first parameter sets the effect to "explode" which means all particles are emitted at once
    //  The second gives each particle a 2000ms lifespan
    //  The third is ignored when using burst/explode mode
    //  The final parameter (10) is how many particles will be emitted in this single burst
    emitter.start(true, 500, null, 5);

}

var game = new Phaser.Game(300, 300, Phaser.CANVAS, 'test multi game', {
    preload: function () {
        game.time.advancedTiming = true;
        //game.load.bitmapFont('carrier_command', '/public/assets/fonts/bitmap/nokia16.png', '/public/assets/fonts/bitmap/nokia16.xml');
        game.load.image('mushroom', '/public/assets/sprites/red_ball.png');
        game.load.image('paddle', '/public/assets/sprites/paddle.png');
        game.load.image('glassParticle', '/public/assets/particles/glass.png');
        style = { font: "10px Arial", fill: "#cccccc", wordWrap: true, wordWrapWidth: 80, align: "center" };
    },
    create: function () {
        //game.world.setBounds(0, 0, 1920, 1920);
        game.physics.startSystem(Phaser.Physics.ARCADE);
        emitter = game.add.emitter(0, 0, 100);
        emitter.makeParticles('glassParticle');

        tempLocalPlayer.sprite = game.add.sprite(0, 0, 'mushroom');
        tempLocalPlayer.sprite.anchor.setTo(0.5, 0.5);
        
        //game.camera.follow(tempLocalPlayer.sprite);
        
        tempLocalPlayer.weapon = game.add.sprite(0, 0, 'paddle');
        tempLocalPlayer.weapon.anchor.setTo(0.5, 0.5);
        
        upKey = game.input.keyboard.addKey(Phaser.Keyboard.UP);
        downKey = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
        leftKey = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
        rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
        
        wKey = game.input.keyboard.addKey(Phaser.Keyboard.W);
        sKey = game.input.keyboard.addKey(Phaser.Keyboard.S);
        aKey = game.input.keyboard.addKey(Phaser.Keyboard.A);
        dKey = game.input.keyboard.addKey(Phaser.Keyboard.D);
        
        //gameTimeText = game.add.bitmapText(game.world.bounds.width, 10, 'carrier_command', '--');
        //gameTimeText.anchor.x = 1;
        //gameTimeText.anchor.y = 0.5;
        //gameTimeText.scale = new Phaser.Point(0.5,0.5);      
        createSocketEvents();
        game.input.onDown.add(particleBurst, this);
    },
    update: function () {
        //process player rotation
        if (currentPlayer && currentPlayer.sprite) {
            socket.emit(Constants.CommandNames.MousePosition, { x: game.input.mousePointer.x, y: game.input.mousePointer.y });
        }
        
        checkMovement(socket);
        checkActions(socket);
        //gameTimeText.text = "Alive Time: " + buildGameTimeText(totalGameTimeInSeconds);
        //gameTimeText.updateText();        
    },
    render: function () {
        game.debug.text(game.time.fps || '--', 2, 14, "#00ff00");
        //game.debug.pixel(gameTimeText.position.x, gameTimeText.position.y, 'rgba(0,255,255,1)');
        //game.debug.text(totalGameTimeInSeconds || '--', 20, 40, "#00ff00");               
    }
});


var createSocketEvents = function () {
    socket = io(window.location.origin, { query: 'nickname=' + Math.floor(1000 * Math.random()) });
    socket.on(Constants.EventNames.Connect, function () {

    });
    
    socket.on(Constants.CommandNames.AlreadyLoggedInPlayerList, function (players) {
        playerList = players;
        for (var id in playerList) {
            var player = playerList[id];
            player.sprite = game.add.sprite(player.position.x, player.position.y, 'mushroom');
            player.sprite.anchor.setTo(0.5, 0.5);            
            
            player.weapon = game.add.sprite(0, 0, 'paddle');
            player.weapon.anchor.setTo(0.5, 0.5);
            player.weapon.tint = "0x" + player.color.replace('#','');

            //style.fill = player.color;
            player.nicknameText = game.add.text(0, 0, player.nickname, style);
            player.nicknameText.anchor.set(0.5);
            console.log("this should be already logged in player" + player.id);
        };
    });
    
    socket.on(Constants.CommandNames.PlayerInfo, function (player) {
        currentPlayer = player;
        currentPlayer.sprite = tempLocalPlayer.sprite;        
        currentPlayer.weapon = tempLocalPlayer.weapon;
        currentPlayer.weapon.tint = "0x" + player.color.replace('#', '');
        
        //style.fill = currentPlayer.color;
        currentPlayer.nicknameText = game.add.text(0, 0, player.nickname, style);
        currentPlayer.nicknameText.anchor.set(0.5);
        
        playerList[currentPlayer.id] = currentPlayer;
        console.log("this should be me and my nickname is " + currentPlayer.nickname + " and my id is " + currentPlayer.id);
    });
    
    socket.on(Constants.CommandNames.NewLoginInfo, function (player) {
        player.sprite = game.add.sprite(player.position.x, player.position.y, 'mushroom');
        player.sprite.anchor.setTo(0.5, 0.5);        
        player.weapon = game.add.sprite(0, 0, 'paddle');
        player.weapon.anchor.setTo(0.5, 0.5);
        player.weapon.tint = "0x" + player.color.replace('#', '');

        //style.fill = player.color;
        player.nicknameText = game.add.text(0, 0, player.nickname, style);
        player.nicknameText.anchor.set(0.5);
        playerList[player.id] = player;
        console.log("this should be new comer and its id is " + player.id + " nickname is " + player.nickname);
    });
    
    socket.on(Constants.CommandNames.DisconnectedPlayerInfo, function (disconnectedPlayer) {
        console.log("this should be disconnected user info" + disconnectedPlayer.id);
        kill(disconnectedPlayer);       
    });
    
    socket.on(Constants.CommandNames.Killed, function (killedPlayer) {
        console.log("player " + killedPlayer.id + " is killed.");
        kill(killedPlayer);
    });
    

    
    socket.on(Constants.CommandNames.PlayerPosRotUpdate, function (playersData) {
        for (var id in playersData) {
            var data = playersData[id];
            var player = playerList[id];
            
            if (player.weapon) {
                player.weapon.position.x = data.weapon.x;
                player.weapon.position.y = data.weapon.y;
                player.weapon.rotation = data.weapon.rotation;
            }
            
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
    
    socket.on("tick", function (tick) {
        totalGameTimeInSeconds = tick;
    });
};

