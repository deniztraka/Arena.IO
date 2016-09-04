var ClientCore = (function (my) {
    
    
    return my;
}(ClientCore || {}));

ClientCore.Constants = (function (my, parent) {
    my.GamePlay = {
        AttackRate : 1 / 4 * 1000
    };
    
    my.Server = {
        MousePositionSendRate : 1 / 30        
    };
    
    return my;
}(ClientCore.Constants || {}, ClientCore));

ClientCore.Socket = (function (my, parent) {
    my.EventNames = {
        
    };
    
    my.CommandNames = {
    
    }

    return my;
}(ClientCore.Socket || {}, ClientCore));

ClientCore.Helpers = (function (my, parent) {
    my.Init = function () {
        Object.size = function (obj) {
            var size = 0, key;
            for (key in obj) {
                if (obj.hasOwnProperty(key)) size++;
            }
            return size;
        };
    };
    
    my.buildGameTimeText = function (totalGameTimeFromSeconds) {
        var seconds = totalGameTimeFromSeconds % 60;
        var minutes = Math.floor(totalGameTimeFromSeconds / 60);
        var hours = Math.floor(minutes / 60);
        
        return hours + ':' + minutes + ':' + seconds;
    };
    
    return my;
}(ClientCore.Helpers || {}, ClientCore));