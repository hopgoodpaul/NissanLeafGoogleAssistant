'use strict';

console.log('Loading the LeafControl function');

const AWS = require('aws-sdk');
let car = require("./leaf");

function processEvent(event, callback) {
    //console.log('Received event:', JSON.stringify(event, null, 2));
    
    const username = event.queryStringParameters.username;
    const password = event.queryStringParameters.password;
    const command = event.queryStringParameters.command;
    const region = event.queryStringParameters.region;
    
    if (username === undefined || password === undefined || command === undefined || region === undefined) {
        callback("400 Invalid Input");
    }

    switch(command) {
        case "heat":
            //console.log('Sending heat command');
            car.sendPreheatCommand(
                () => callback(null, "Preheat command sent"),
                () => callback("500 could not send preheat command"),
                username,
                password,
                region
            );
            break;
        case "cool":
            //console.log('Sending cool command');
            car.sendCoolingCommand(
                () => callback(null, "Cooling command sent"),
                () => callback("500 could not send cooling command"),
                username,
                password,
                region
            );
            break;
        case "off":
            //console.log('Sending climate off command');
            car.sendClimateControlOffCommand(
                () => callback(null, "Climate off command sent"),
                () => callback("500 could not send climate off command"),
                username,
                password,
                region
            );
            break;
        default:
            callback("400 Invalid Input");
            break;
    }
}


exports.handler = (event, context, callback) => {
    const done = (err, res) => callback(null, {
        statusCode: err ? '400' : '200',
        body: err ? (err.message || err) : JSON.stringify(res),
        headers: {
            'Content-Type': 'application/json',
        },
    });


    processEvent(event, done);
};


 