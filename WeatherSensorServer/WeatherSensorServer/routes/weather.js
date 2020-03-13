'use strict';
var json = require('serializr');
var express = require('express');
var router = express.Router();

class SensorData {
    constructor(temperature, humidity, pressure, timestamp) {
        this.temperature = temperature;
        this.humidity = humidity;
        this.pressure = pressure;
        this.timestamp = timestamp;
    }
}

class WeatherReport {
    constructor(
    temperatureUnits,
    humidityUnits,
    pressureUnits,
    sensorDataHistory
    ) {
        this.temperatureUnits = temperatureUnits;
        this.humidityUnits = humidityUnits;
        this.pressureUnits = pressureUnits;
        this.sensorDataHistory = sensorDataHistory;
    }
}

function getMockHistory() {
    let count = 5;
    let history = new Array();
    let i = 0;
    for (i = 0; i < count; i++) {
        let t = Math.random(13, 37);
        let h = Math.random(30, 80);
        let p = Math.random(95, 110);
        let time = new Date().valueOf() - 1000*60*60 * i;
        history += new SensorData(t, h, p, time);
    }
    let report = new WeatherReport('°C', '%', 'kPa', history);
    return report;
}

/* GET users listing. */
router.get('/', function (req, res) {
    let report = getMockHistory();
    let str = json.serialize(report);
    res.send(str);
});

module.exports = router;