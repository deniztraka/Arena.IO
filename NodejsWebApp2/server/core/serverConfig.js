module.exports = {
    server: {
        serverProcessFrequency : 1 / 60,
        maxSubSteps: 10,
        gameTimeUpdateFrequencyFromSeconds : 1,
        healthStaminaUpdateFrequencyFromSeconds : 1 / 10,
        positionAndRotationUpdateFrequencyFromSeconds : 1 / 30,
        scoreUpdateFrequencyFromSeconds: 1,
        randomBonusGenerationProcess : 1        
    },
    gamePlay: {
        worldBounds: {
            width: 1920,
            height:1920
        },
        slashRate: 0.25,
        staminaIncreaseFrequencyFromSeconds: 1,
        staminaIncreaseRate: 1,
        staminaDecreaseRateWhileRunning: 0.25,
        movementSpeed : 1,
        defendSpeed : 0.5,
        runningSpeedMultiplier: 1.75,
        maxActiveBonusCount: 10,
        bonusTypes: ["health","stamina"]
    }
}