Constants = {
    EventNames : {
        Connection : "connection",
        OnPlayerDisconnect : "disconnect",
        Connect : "connect",
        OnUpdateRotation : "onUpdateRotation",
        OnUpKeyPressed: "onUpKeyPressed",
        OnDownKeyPressed: "onDownKeyPressed",
        OnLeftKeyPressed: "onLeftKeyPressed",
        OnRightKeyPressed: "onRightKeyPressed",
        OnShiftKeyPressed: "onShiftKeyPressed",
        OnEKeyPressed: "onEKeyPressed",
        OnMouseClicked: "onMouseClicked"
    },
    CommandNames : {
        NewLoginInfo : "newLoginInfo",
        DisconnectedPlayerInfo : "disconnectedPlayerInfo",
        PlayerInfo : "playerInfo",
        AlreadyLoggedInPlayerList : "alreadyLoggedInPlayerList",
        PlayerPosRotUpdate: "playerPosRotUpdate",
        MousePosition : "mousePosition",
        Killed : "killed",
        DamageDealtUpdate : "damageDealtUpdate",
        KillCountUpdate : "killCountUpdate",
        DamageGiven: "damageGiven",
        HealthStaminaUpdate: "healthStaminaUpdate"
    }
};

if (typeof module !== 'undefined') {
    module.exports = Constants;
}