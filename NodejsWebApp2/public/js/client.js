ClientCore.Helpers.Init();

//Props
var totalGameTimeInSeconds = 0;
var socket;

var playerList = {};
var damageDealtList = [];
var killCountList = [];

// *Player
var tempLocalPlayer = {};
var currentPlayer;
var nextAttack = 0;
var nextMousePositionSendTime = 0;
var myHealthBar;
var myStamBar;

// *Keys
var upKey;
var downKey;
var leftKey;
var rightKey;
var shiftKey;
var wKey;
var aKey;
var dKey;
var sKey;

// *Phaser Props
var style;
var fx;
var emitter = null;

var game = new Phaser.Game("100%", "100%", Phaser.CANVAS, 'test multi game', {
    preload: function () {
        game.time.advancedTiming = true;
        //game.load.bitmapFont('carrier_command', '/public/assets/fonts/bitmap/nokia16.png', '/public/assets/fonts/bitmap/nokia16.xml');
        game.load.image('mushroom', '/public/assets/sprites/red_ball.png');
        game.load.image('paddle', '/public/assets/sprites/paddle.png');
        game.load.image('shield', '/public/assets/sprites/shield.png');
        game.load.image('glassParticle', '/public/assets/particles/glass.png');
        game.load.image('grass', '/public/assets/sprites/tiles/grass1.png');
        game.load.audio('sfx', '/public/assets/audio/effects/fx_mixdown.ogg');
        style = { font: "10px Arial", fill: "#cccccc", wordWrap: true, wordWrapWidth: 80, align: "center" };
    },
    create: function () {
        game.world.setBounds(0, 0, 1920, 1920);
        
        tilesprite = game.add.tileSprite(0, 0, game.world.bounds.width, game.world.bounds.height, 'grass');
        game.physics.startSystem(Phaser.Physics.ARCADE);
        emitter = game.add.emitter(0, 0, 100);
        emitter.makeParticles('glassParticle');
        
        tempLocalPlayer.sprite = game.add.sprite(0, 0, 'mushroom');
        tempLocalPlayer.sprite.anchor.setTo(0.5, 0.5);
        
        game.camera.follow(tempLocalPlayer.sprite);
        
        tempLocalPlayer.weapon = game.add.sprite(0, 0, 'paddle');
        tempLocalPlayer.weapon.anchor.setTo(0.5, 0.5);
        tempLocalPlayer.shield = game.add.sprite(0, 0, 'shield');
        tempLocalPlayer.shield.anchor.setTo(0.5, 0.5);

              
        
        upKey = game.input.keyboard.addKey(Phaser.Keyboard.UP);
        downKey = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
        leftKey = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
        rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
        shiftKey = game.input.keyboard.addKey(Phaser.Keyboard.SHIFT)
        
        wKey = game.input.keyboard.addKey(Phaser.Keyboard.W);
        sKey = game.input.keyboard.addKey(Phaser.Keyboard.S);
        aKey = game.input.keyboard.addKey(Phaser.Keyboard.A);
        dKey = game.input.keyboard.addKey(Phaser.Keyboard.D);
        
        //	Here we set-up our audio sprite
        fx = game.add.audio('sfx');
        fx.allowMultiple = true;
        
        fx.addMarker('hit', 1, 1.0);//alien death
        fx.addMarker('boss hit', 3, 0.5);
        fx.addMarker('escape', 4, 3.2);
        fx.addMarker('meow', 8, 0.5);
        fx.addMarker('numkey', 9, 0.1);
        fx.addMarker('ping', 10, 1.0);
        fx.addMarker('death', 12, 4.2);
        fx.addMarker('kill', 17, 1.0);//shot
        fx.addMarker('squit', 19, 0.3);
        
        //gameTimeText = game.add.bitmapText(game.world.bounds.width, 10, 'carrier_command', '--');
        //gameTimeText.anchor.x = 1;
        //gameTimeText.anchor.y = 0.5;
        //gameTimeText.scale = new Phaser.Point(0.5,0.5);  
        
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;
        // using RESIZE scale mode
        game.scale.scaleMode = Phaser.ScaleManager.SHOWALL;
        
        
        createSocketEvents();
    },
    update: function () {
        //process player rotation
        if (currentPlayer && currentPlayer.sprite) {
            var totalElapsedSeconds = game.time.now;
            if (totalElapsedSeconds > nextMousePositionSendTime) {
                nextMousePositionSendTime = totalElapsedSeconds + ClientCore.Constants.Server.MousePositionSendRate;
                socket.emit(Constants.CommandNames.MousePosition, { x: game.input.mousePointer.worldX, y: game.input.mousePointer.worldY });
            }            
        }
        
        checkMovement(socket);
        checkActions(socket);
        //gameTimeText.text = "Alive Time: " + buildGameTimeText(totalGameTimeInSeconds);
        //gameTimeText.updateText();        
    },
    render: function () {
        var onlineCount = parseInt(Object.size(playerList));
        if (currentPlayer) {
            //Fps & Online Count Rendering
            game.debug.text("Fps: " + game.time.fps || '--', 2, 15, "#666666");
            game.debug.text("Online: " + onlineCount, 2, 30, "#666666");
            
            //Player Nickname Rendering
            game.debug.text(currentPlayer.nickname || '--', 2, $(window).height() - 42, currentPlayer.color);
            
            //Player Health & Stamina Rendering
            game.debug.text("         " + currentPlayer.health || '--', 5, $(window).height() - 25, '#666666');
            game.debug.text("         " + currentPlayer.stamina || '--', 5, $(window).height() - 5, '#666666');
        }
        
        //Damage Dealt Score Table Rendering
        if (damageDealtList && damageDealtList.length > 0) {
            var yValue = 80;
            game.debug.text("Damage Dealt Score", 2, yValue - 15, '#ffffff');
            
            var maxDamageScoreShowCount = 5;
            var damageShowCount = 0;
            for (var i = 0; i < damageDealtList.length; i++) {
                if (damageShowCount < maxDamageScoreShowCount && playerList[damageDealtList[i].id]) {
                    game.debug.text(playerList[damageDealtList[i].id].nickname + " : " + damageDealtList[i].damageDealt, 2, yValue, playerList[damageDealtList[i].id].color);
                    damageShowCount++;
                    yValue += 13;
                } else {
                    return;
                }
            };
        }
        
        //Kill Count Score Table Rendering
        if (killCountList && killCountList.length > 0) {
            var yValue = 175;
            game.debug.text("Kill Count Score", 2, yValue - 15, '#ffffff');
            
            var maxKillScoreShowCount = 5;
            var killShowCount = 0;
            for (var i = 0; i < killCountList.length; i++) {
                if (killShowCount < maxKillScoreShowCount) {
                    game.debug.text(playerList[killCountList[i].id].nickname + " : " + killCountList[i].killCount, 2, yValue, playerList[killCountList[i].id].color);
                    killShowCount++;
                    yValue += 13;
                } else {
                    return;
                }
            };
        }
    }
});

//Socket event handling
var createSocketEvents = function () {
    socket = io(window.location.origin, { query: 'nickname=' + $('#nicknameText').val() });
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
            player.weapon.tint = "0x" + player.color.replace('#', '');
            
            player.shield = game.add.sprite(0, 0, 'shield');
            player.shield.anchor.setTo(0.5, 0.5);
            player.shield.tint = "0x" + player.color.replace('#', '');
            
            //style.fill = player.color;
            player.nicknameText = game.add.text(0, 0, player.nickname, style);
            player.nicknameText.anchor.set(0.5);
            //console.log("this should be already logged in player" + player.id);
        };
    });
    
    socket.on(Constants.CommandNames.HealthStaminaUpdate, function (healthStaminaData) {
        for (var id in healthStaminaData) {
            
            if (id == currentPlayer.id) {
                myHealthBar.setPercent(healthStaminaData[id].health);
                myStamBar.setPercent(healthStaminaData[id].stamina);
            }
            playerList[id].health = healthStaminaData[id].health;
            playerList[id].stamina = healthStaminaData[id].stamina;
        }
    });
    
    socket.on(Constants.CommandNames.PlayerInfo, function (player) {
        currentPlayer = player;
        currentPlayer.sprite = tempLocalPlayer.sprite;
        currentPlayer.weapon = tempLocalPlayer.weapon;
        currentPlayer.shield = tempLocalPlayer.shield;
        currentPlayer.weapon.tint = "0x" + player.color.replace('#', '');
        currentPlayer.shield.tint = "0x" + player.color.replace('#', '');
        myHealthBar = new HealthBar(game, {
            width: 140,
            height: 15,
            x: 55,
            y: $(window).height() - 30,            
            bar: {
                color: 'darkred'
            },
            isFixedToCamera: true
        });
        
        myStamBar = new HealthBar(game, {
            width: 140,
            height: 15,
            x: 55,
            y: $(window).height() - 10,            
            bar: {
                color: 'blue'
            },
            isFixedToCamera: true
        });
        
        //style.fill = '#000000';//currentPlayer.color;
        //currentPlayer.nicknameText = game.add.text(0, 0, player.nickname, style);
        //currentPlayer.nicknameText.anchor.set(0.5);
        
        playerList[currentPlayer.id] = currentPlayer;
        //console.log("this should be me and my nickname is " + currentPlayer.nickname + " and my id is " + currentPlayer.id);
    });
    
    socket.on(Constants.CommandNames.NewLoginInfo, function (player) {
        player.sprite = game.add.sprite(player.position.x, player.position.y, 'mushroom');
        player.sprite.anchor.setTo(0.5, 0.5);
        player.weapon = game.add.sprite(0, 0, 'paddle');
        player.weapon.anchor.setTo(0.5, 0.5);
        player.weapon.tint = "0x" + player.color.replace('#', '');
        
        player.shield = game.add.sprite(0, 0, 'shield');
        player.shield.anchor.setTo(0.5, 0.5);
        player.shield.tint = "0x" + player.color.replace('#', '');
        
        //style.fill = player.color;
        player.nicknameText = game.add.text(0, 0, player.nickname, style);
        player.nicknameText.anchor.set(0.5);
        playerList[player.id] = player;
        //console.log("this should be new comer and its id is " + player.id + " nickname is " + player.nickname);
    });
    
    socket.on(Constants.CommandNames.DisconnectedPlayerInfo, function (disconnectedPlayer) {
        //console.log("this should be disconnected user info" + disconnectedPlayer.id);
        kill(disconnectedPlayer);
    });
    
    socket.on(Constants.CommandNames.Killed, function (killedPlayer) {
        //console.log("player " + killedPlayer.id + " is killed.");
        fx.play("kill");
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
            
            if (player.shield) {
                player.shield.position.x = data.shield.x;
                player.shield.position.y = data.shield.y;
                player.shield.rotation = data.shield.rotation;
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
    
    
    socket.on(Constants.CommandNames.DamageDealtUpdate, function (pDamageDealtData) {
        damageDealtList = [];
        for (var key in pDamageDealtData) {
            var damageDealtVal = pDamageDealtData[key];
            damageDealtList.push({ id: key, damageDealt: damageDealtVal });
        }
        damageDealtList.sort(function (a, b) {
            return b.damageDealt - a.damageDealt;
        });
    });
    
    socket.on(Constants.CommandNames.KillCountUpdate, function (killCountData) {
        killCountList = [];
        for (var key in killCountData) {
            var killCountVal = killCountData[key];
            killCountList.push({ id: key, killCount: killCountVal });
        }
        killCountList.sort(function (a, b) {
            return b.killCount - a.killCount;
        });
    });
    
    socket.on("animAttack", function (animPos) {
        particleBurst(animPos);
        fx.play("hit");
    });
    
    socket.on("tick", function (tick) {
        totalGameTimeInSeconds = tick;
    });
};

//Game core functions
function kill(player) {
    if (playerList[player.id]) {
        if (playerList[player.id].nicknameText) {
            playerList[player.id].nicknameText.destroy();
        }
        
        playerList[player.id].weapon.destroy();
        playerList[player.id].shield.destroy();
        playerList[player.id].sprite.destroy();
        
        delete playerList[player.id];
    }
}

var checkMovement = function (socket) {
    if (upKey.isDown || wKey.isDown) {
        socket.emit(Constants.EventNames.OnUpKeyPressed, true);
        //currentPlayer.sprite.position.y--;
    }
    else if (downKey.isDown || sKey.isDown) {
        socket.emit(Constants.EventNames.OnDownKeyPressed, true);
        //currentPlayer.sprite.position.y++;
    }
    
    if (leftKey.isDown || aKey.isDown) {
        socket.emit(Constants.EventNames.OnLeftKeyPressed, true);
        //currentPlayer.sprite.position.x--;
    }
    else if (rightKey.isDown || dKey.isDown) {
        socket.emit(Constants.EventNames.OnRightKeyPressed, true);
        //currentPlayer.sprite.position.x++;
    }
    
    if (shiftKey.isDown) {
        socket.emit(Constants.EventNames.OnShiftKeyPressed, true);
    }
    
    game.input.keyboard.onUpCallback = function (e) {
        if (e.keyCode == Phaser.Keyboard.SHIFT) {
            socket.emit(Constants.EventNames.OnShiftKeyPressed, false);
        }
    }
}

function triggerAttackAnimation(position) {
    var maxSlashDistance = 20;
    
    var xDistance = (position.x - currentPlayer.position.x);
    var yDistance = (position.y - currentPlayer.position.y);
    
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
    
    var animPosX = currentPlayer.weapon.position.x + xDistance;
    var animPosY = currentPlayer.weapon.position.y + yDistance;
    
    var radius = 20;
    var thereIsPlayer = false;
    for (var id in playerList) {
        var player = playerList[id];
        //debugger;
        if (player.position.x + radius / 2 > animPosX && player.position.x - radius / 2 < animPosX) {
            if (player.position.y + radius / 2 > animPosY && player.position.y - radius / 2 < animPosY) {
                particleBurst({ x: player.position.x, y: player.position.y });
            }
        }
    };
}

function attack() {
    var totalElapsedSeconds = game.time.now;
    if (totalElapsedSeconds > nextAttack) {
        nextAttack = totalElapsedSeconds + ClientCore.Constants.GamePlay.AttackRate;
        socket.emit(Constants.EventNames.OnMouseClicked, { x: game.input.mousePointer.worldX, y: game.input.mousePointer.worldY });
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
    
    emitter.setScale(0.25, 0.001, 0.25, 0.001, 750, Phaser.Easing.Quintic.Out);
    
    //  The first parameter sets the effect to "explode" which means all particles are emitted at once
    //  The second gives each particle a 2000ms lifespan
    //  The third is ignored when using burst/explode mode
    //  The final parameter (10) is how many particles will be emitted in this single burst
    emitter.start(true, 500, null, 5);

}

//resizing utils
function resizeGame() {
    game.scale.setGameSize($(window).width(), $(window).height());
    myHealthBar.setPosition(2, $(window).height()-5);
}

$(window).resize(function () {
    resizeGame();
});