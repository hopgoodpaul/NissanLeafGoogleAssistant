"use strict";

//Credit to https://github.com/ScottHelme/AlexaNissanLeaf

let https = require("https");

// Require encryption.js to encrypt the password.
var Encryption = require('./encryption.js');

// Do not change this value, it is static.
let initial_app_strings = "geORNtsZe5I4lRGjG9GZiA";

let sessionid, vin, timeFrom;

/**
* Sends a request to the Nissan API.
*
* action - The API endpoint to call, like UserLoginRequest.php.
* requestData - The URL encoded parameter string for the current call.
* successCallback
* failureCallback
**/
function sendRequest(action, requestData, successCallback, failureCallback) {	
	const options = {
		hostname: "gdcportalgw.its-mo.com",
		port: 443,
		path: "/gworchest_160803EC/gdc/" + action,
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			"Content-Length": Buffer.byteLength(requestData),
		}
	};

	const req = https.request(options, resp => {
		if (resp.statusCode < 200 || resp.statusCode > 300) {
			console.log(`Failed to send request ${action} (${resp.statusCode}: ${resp.statusMessage})`);
			if (failureCallback)
				failureCallback();
			return;
		}

		console.log(`Successful request ${action} (${resp.statusCode}: ${resp.statusMessage})`);
		let respData = "";

		resp.on("data", c => {
			respData += c.toString();
		});
		resp.on("end", () => {
			let json = respData && respData.length ? JSON.parse(respData) : null;
			if (json.status == 200) {
				if (process.env.debugLogging && respData && respData.length)
					console.log(json);
				successCallback(respData && respData.length ? JSON.parse(respData) : null);
			}else {
				console.log("Request to " + action + " was not successful");
				if (failureCallback)
					failureCallback();
			}
		});
	});

	req.write(requestData);
	req.end();
}

/**
* Log the current user in to retrieve a valid session token.
* 
* successCallback
**/
function login(successCallback, failureCallback, username, password, region_code) {
	sendRequest("UserLoginRequest.php", 
	"UserId=" + username +
	"&initial_app_strings=" + initial_app_strings +
	"&RegionCode=" + region_code +
	"&Password=" + encrypt(password),
	loginResponse => {
		// Get the session id and VIN for future API calls.
		// Sometimes the results from the API include a VehicleInfoList array, sometimes they omit it!
		if (loginResponse.VehicleInfoList) {
			sessionid = encodeURIComponent(loginResponse.VehicleInfoList.vehicleInfo[0].custom_sessionid);
			vin = encodeURIComponent(loginResponse.VehicleInfoList.vehicleInfo[0].vin);
			timeFrom = loginResponse.VehicleInfoList.vehicleInfo[0].UserVehicleBoundTime;
		} else  {
			sessionid = encodeURIComponent(loginResponse.vehicleInfo[0].custom_sessionid);
			vin = encodeURIComponent(loginResponse.vehicleInfo[0].vin);
			timeFrom = loginResponse.vehicleInfo[0].UserVehicleBoundTime;		
		}
		successCallback();
	}, 
	failureCallback);
}

/**
* Enable the climate control in the car.
**/
exports.sendPreheatCommand = (successCallback, failureCallback, username, password, region_code) => {
	login(() => sendRequest("ACRemoteRequest.php",
	"UserId=" + username +
	"&custom_sessionid=" + sessionid +
	"&RegionCode=" + region_code +
	"&VIN=" + vin,
	successCallback,
	failureCallback), failureCallback, username, password, region_code);
}

/**
* Enable the climate control in the car.
**/
exports.sendCoolingCommand = (successCallback, failureCallback, username, password, region_code) => {
	login(() => sendRequest("ACRemoteRequest.php",
	"UserId=" + username +
	"&custom_sessionid=" + sessionid +
	"&RegionCode=" + region_code +
	"&VIN=" + vin,
	successCallback,
	failureCallback), failureCallback, username, password, region_code);
}

/**
* Disable the climate control in the car.
**/
exports.sendClimateControlOffCommand = (successCallback, failureCallback, username, password, region_code) => {
	login(() => sendRequest("ACRemoteOffRequest.php",
	"UserId=" + username +
	"&custom_sessionid=" + sessionid +
	"&RegionCode=" + region_code +
	"&VIN=" + vin,
	successCallback,
	failureCallback), failureCallback, username, password, region_code);
}

/**
* Encrypt the password for use with API calls.
**/
function encrypt(password) {
	var e = new Encryption();
	return e.encrypt(password, "uyI5Dj9g8VCOFDnBRUbr3g");
}
