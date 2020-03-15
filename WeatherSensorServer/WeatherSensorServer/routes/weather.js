'use strict';
var express = require('express');
var net = require('net');
var tcpClient = new net.Socket();
var router = express.Router();
var fs = require('fs');

let weatherRamHistory = new Array();
const weatherHistoryPath = "/tmp/weather.txt";
const weatherHistoryMaxLines = 128;

class SensorData {
    constructor(temperature, humidity, pressure, timestamp, channelId) {
        this.temperature = temperature;
        this.humidity = humidity;
        this.pressure = pressure;
        this.timestamp = timestamp;
        this.channelId = channelId;
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

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function getMockHistory() {
    let count = 5;
    let history = new Array();
    let i = 0;
    let date = new Date().valueOf() + 1000 * 60 * 60 * count;
    for (i = 0; i < count; i++) {
        let t = random(13, 27);
        let h = random(30, 80);
        let p = random(95, 110);
        let time = date + 1000*60*60 * i;
        history.push(new SensorData(t, h, p, time));
    }
    let report = new WeatherReport('C', '%', 'kPa', history);
    return report;
}

function serialize(report) {
    let jsonResult = "{";

    jsonResult += "\"temperatureUnits\":" + "\"" + report.temperatureUnits + "\"" + ",";
    jsonResult += "\"humidityUnits\":" + "\"" + report.humidityUnits + "\"" + ",";
    jsonResult += "\"pressureUnits\":" + "\"" + report.pressureUnits + "\"" + ",";
    jsonResult += "\"sensorDataHistory\":" + "[";

    let i = 0;
    for (i = 0; i < report.sensorDataHistory.length; i++) {
        let data = report.sensorDataHistory[i];
        jsonResult += "{";
        jsonResult += "\"temperature\":" + "\"" + data.temperature + "\",";
        jsonResult += "\"humidity\":" + "\"" + data.humidity + "\",";
        jsonResult += "\"pressure\":" + "\"" + data.pressure + "\",";
        jsonResult += "\"timestamp\":" + "\"" + data.timestamp + "\"";
        jsonResult += "}, ";
    }

    jsonResult += "]}";

    return jsonResult;
}

function writeWeather(sensorData) {
    weatherRamHistory.push(sensorData);
}

function readWeather(channelId, fromDate, toDate) {

    let history = new Array();
    let lastIndex = weatherRamHistory.length - 1;

    // Find fromDate index
    let startIndex = lastIndex + 1;
    while (startIndex > 0) {
        startIndex--;
        let element = weatherRamHistory[startIndex];
        if (element.channelId !== channelId) {
            continue;
        }
        if (element.timestamp >= fromDate) {
            continue;
        } else {
            break;
        }
    }

    // Find toDate index
    let endIndex = startIndex - 1;
    while (endIndex < lastIndex) {
        endIndex++;
        let element = weatherRamHistory[endIndex];
        if (element.channelId !== channelId) {
            continue;
        }
        if (element.timestamp <= toDate) {
            continue;
        } else {
            break;
        }
    }

    for (let i = startIndex; i <= endIndex; i++) {
        let element = weatherRamHistory[i];
        if (element.channelId !== channelId) {
            continue;
        }
        history.push(element);
    }

    let report = new WeatherReport('C', '%', 'kPa', history);
    return report;
    //return getMockHistory();
}

tcpClient.connect(3001, 'localhost', function () {
    console.log('Connected to WeatherSensorBridge');
});

tcpClient.on('data', function (data) {
    let channelId = data[0];
    let t = (data[2] << 8) | data[1];
    let h = (data[4] << 8) | data[3];
    let p = (data[8] << 32) | (data[7] << 16) | (data[6] << 8) | (data[5]);

    let temperature = t / 10.0;
    let humidity = h / 10.0;
    let pressure = p / 1000.0;
    let timestamp = new Date().valueOf();

    let sensorData = new SensorData(temperature, humidity, pressure, timestamp, channelId);
    writeWeather(sensorData);
    console.log('WeatherSensorBridge data received: T: ' + temperature + ", H: " + humidity + ", P: " + pressure);
});

tcpClient.on('close', function () {
    console.log('WeatherSensorBridge connection closed');
});

/* GET users listing. */
router.get('/', function (req, res) {

    let channelId = req.query.channelId;
    let fromDate = req.query.from;
    let toDate = req.query.to;

    if (toDate === 'now') {
        toDate = new Date().valueOf();
    }

    if (fromDate === undefined) {
        fromDate = new Date().valueOf() - 1000 * 15; // 15 seconds earlier
    }

    if (channelId === undefined) {
        channelId = 0;
    }

    let report = readWeather(parseInt(channelId), parseInt(fromDate), parseInt(toDate)); // TODO Make count to be GET argument
    let strJson = JSON.stringify(report);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(strJson);
});

module.exports = router;