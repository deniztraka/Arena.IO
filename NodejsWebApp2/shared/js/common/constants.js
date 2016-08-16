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
        DamageDealtUpdate : "DamageDealtUpdate",
        DamageGiven: "damageGiven",
        HealthStaminaUpdate: "healthStaminaUpdate"
    }
};

if (typeof module !== 'undefined') {
    module.exports = Constants;
}