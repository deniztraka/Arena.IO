module.exports = {
    server: {
        serverProcessFrequency : 1 / 60,
        maxSubSteps: 10,
        gameTimeUpdateFrequencyFromSeconds : 1,
        healthUpdateFrequencyFromSeconds : 1 / 10,
        positionAndRotationUpdateFrequencyFromSeconds : 1 / 30,
        damageDealtUpdateFrequencyFromSeconds : 1
    },
    gamePlay: {
        slashRate: 0.5
    }
}