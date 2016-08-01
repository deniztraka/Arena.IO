Constants = {
    EventNames : {
        Connection : "connection",
        OnPlayerDisconnect : "disconnect",
        Connect : "connect",
        OnUpdateRotation : "onUpdateRotation",
        OnUpKeyPressed: "onUpKeyPressed",
        OnDownKeyPressed: "onDownKeyPressed",
        OnLeftKeyPressed: "onLeftKeyPressed",
        OnRightKeyPressed: "onRightKeyPressed"
    },
    CommandNames : {
        NewLoginInfo : "newLoginInfo",
        DisconnectedPlayerInfo : "disconnectedPlayerInfo",
        PlayerInfo : "playerInfo",
        AlreadyLoggedInPlayerList : "alreadyLoggedInPlayerList",
        PlayerPosRotUpdate: "playerPosRotUpdate"
    }
};

if (typeof module !== 'undefined' ) {
    module.exports = Constants;
}