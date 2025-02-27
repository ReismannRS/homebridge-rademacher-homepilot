var tools = require("./tools.js");
var RademacherBlindsAccessory = require("./RademacherBlindsAccessory.js");

function RademacherEnvironmentSensorAccessory(log, accessory, sensor, session, inverted) {
	RademacherBlindsAccessory.call(this, log, accessory, sensor, session, inverted);

    this.meter = null;
    this.lastMeterUpdate = 0
    this.services = [this.service];
    
    // temperature sensor
    var temperatureService = this.accessory.getService(global.Service.TemperatureSensor);
    temperatureService.getCharacteristic(global.Characteristic.CurrentTemperature)
		.setProps({minValue: -30.0, maxValue: 80.0})
		.on('get', this.getCurrentTemperature.bind(this));
    this.services.push(temperatureService);
    
    // light sensor
    var lightService = this.accessory.getService(global.Service.LightSensor);
    lightService.getCharacteristic(global.Characteristic.CurrentAmbientLightLevel)
		.setProps({minValue: 0, maxValue: 150000})
		.on('get', this.getCurrentAmbientLightLevel.bind(this));
    this.services.push(lightService);

    this.accessory.updateReachability(true);
}

RademacherEnvironmentSensorAccessory.prototype = Object.create(RademacherBlindsAccessory.prototype);

RademacherEnvironmentSensorAccessory.prototype.getMeter = function(callback) {
    if (this.lastMeterUpdate < Date.now()) {
    	var self = this;
        this.session.get("/devices/" + this.did, 2500, function(e, body) {
    		if(e) return callback(new Error("Request failed: "+e), false);
    		var meter = body.data;
    		self.meter = meter;
    		self.lastMeterUpdate = Date.now();
    		callback(null, meter)
    	});
    } else {
    	callback(null, this.meter);
    }
};

RademacherEnvironmentSensorAccessory.prototype.getCurrentTemperature = function (callback) {
    this.log("%s - Getting current temperature", this.accessory.displayName);

    var self = this;
    this.getMeter(function(e, d) {
    	if(e) return callback(e, false);
    	d.forEach(function(pair) {
        	if(pair.hasOwnProperty("Temperatur")) {
        		var value = parseFloat(pair["Temperatur"].replace(",", "."));
            	callback(null, value);
        	}
        });
    });
};

RademacherEnvironmentSensorAccessory.prototype.getCurrentAmbientLightLevel = function (callback) {
    this.log("%s - Getting current ambient light level", this.accessory.displayName);

    var self = this;
    this.getMeter(function(e, d) {
    	if(e) return callback(e, false);
    	d.forEach(function(pair) {
        	if(pair.hasOwnProperty("Lichtwert")) {
        		var value = parseFloat(pair["Lichtwert"].replace(",", "."));
            	callback(null, value);
            }
        });
    });
};

RademacherEnvironmentSensorAccessory.prototype.getServices = function () {
    return this.services;
};

module.exports = RademacherEnvironmentSensorAccessory;