var Accessory, Service, Characteristic, UUIDGen;

var RademacherHomePilotSession = require('./accessories/RademacherHomePilotSession.js');
var RademacherBlindsAccessory = require('./accessories/RademacherBlindsAccessory.js');
var RademacherLockAccessory = require('./accessories/RademacherLockAccessory.js');
var RademacherDimmerAccessory = require ('./accessories/RademacherDimmerAccessory.js');
var RademacherSwitchAccessory = require ('./accessories/RademacherSwitchAccessory.js');
var RademacherSmokeAlarmAccessory = require ('./accessories/RademacherSmokeAlarmAccessory.js');
var RademacherEnvironmentSensorAccessory = require ('./accessories/RademacherEnvironmentSensorAccessory.js');
var RademacherTemperatureSensorAccessory = require ('./accessories/RademacherTemperatureSensorAccessory.js');
var RademacherThermostatAccessory = require('./accessories/RademacherThermostatAccessory.js');

module.exports = function(homebridge) {
    global.Accessory = homebridge.platformAccessory;
    global.Service = homebridge.hap.Service;
    global.Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    homebridge.registerPlatform("homebridge-rademacher-homepilot", "RademacherHomePilot", RademacherHomePilot, true);
};

function RademacherHomePilot(log, config, api) {
    // global vars
    this.log = log;

    var self = this;

    // configuration vars
    this.accessories = [];
    this.inverted = true;

    // HomePilot session
    this.session = new RademacherHomePilotSession(log, config["url"], config["password"]);

    if (api) {
        this.api = api;

        this.api.on('didFinishLaunching', function() {
            var handleActuators = function(e, body) {
                if(e) throw new Error("Request failed: "+e);
                if (body.devices)
                {
                    body.devices.forEach(function(data) {
                        var uuid = UUIDGen.generate("did"+data.did);
                        var accessory = self.accessories[uuid];
                        
                        // blinds
                        if(["27601565","35000864","14234511","35000662","36500172","36500572_A","16234511_A","45059071"].includes(data.deviceNumber))
                        {
                            if (accessory === undefined) {
                                self.addBlindsAccessory(data);
                            }
                            else {
                                self.log("blinds are online: %s [%s]", accessory.displayName, data.did);
                                self.accessories[uuid] = new RademacherBlindsAccessory(self.log, (accessory instanceof RademacherBlindsAccessory ? accessory.accessory : accessory), data, self.session, self.inverted);
                            }
                        }
                        // dimmer
                        else if(["?"].includes(data.deviceNumber))
                        {
                            if (accessory === undefined) {
                                self.addDimmerAccessory(data);
                            }
                            else {
                                self.log("dimmer is online: %s [%s]", accessory.displayName, data.did);
                                self.accessories[uuid] = new RademacherDimmerAccessory(self.log, (accessory instanceof RademacherDimmerAccessory ? accessory.accessory : accessory), data, self.session, self.inverted);
                            }
                        }
                        // thermostat
                        else if(["35003064","32501812_A","35002319"].includes(data.deviceNumber))
                        {
                            if (accessory === undefined) {
                                self.addThermostatAccessory(data);
                            }
                            else {
                                self.log("thermostat is online: %s [%s]", accessory.displayName, data.did);
                                self.accessories[uuid] = new RademacherThermostatAccessory(self.log, (accessory instanceof RademacherThermostatAccessory ? accessory.accessory : accessory), data, self.session, self.inverted);
                            }
                        }
                        // lock/switch
                        else if(["35000262","35001164"].includes(data.deviceNumber))
                        {
                            // icon = "Schließkontakt" ? => lock
                            if (data.iconSet.k.includes("iconset27")){
                                if (accessory === undefined) {
                                    self.addLockAccessory(data);
                                }
                                else
                                { 
                                    self.log("lock is online: %s [%s]", accessory.displayName, data.did);
                                    self.accessories[uuid] = new RademacherLockAccessory(self.log, (accessory instanceof RademacherLockAccessory ? accessory.accessory : accessory), data, self.session);
                                }
                            }
                            else {
                                if (accessory === undefined) {
                                    self.addSwitchAccessory(data);
                                }
                                else
                                {
                                    self.log("switch is online: %s [%s]", accessory.displayName, data.did);
                                    self.accessories[uuid] = new RademacherSwitchAccessory(self.log, (accessory instanceof RademacherSwitchAccessory ? accessory.accessory : accessory), data, self.session);
                                }
                            }
                        }
                        // enviroment sensor
                        else if(["32000064","32000064_A","32000064_S"].includes(data.deviceNumber))
                        {
                            self.addEnvironmentSensorAccessory(accessory, data);
                        }
                        // unknown
                        else
                        {
                        self.log("Unknown product: %s",data.deviceNumber);
                        self.log(data);
                        }
                    });
                }
                else
                {
                    self.log("No devices found in %s",body);
                }
            };
            var handleSensors = function(e, body) {
                if(e) throw new Error("Request failed: "+e);
                if (body.meters)
                {
                    body.meters.forEach(function(data) {
                        var uuid = UUIDGen.generate("did"+data.did);
                        var accessory = self.accessories[uuid];
                        
                        // smoke alarm
                        if(["32001664"].includes(data.deviceNumber))
                        {
                            if (accessory === undefined) {
                                self.addSmokeAlarmAccessory(data);
                            }
                            else {
                                self.log("smoke alarm is online: %s [%s]", accessory.displayName, data.did);
                                self.accessories[uuid] = new RademacherSmokeAlarmAccessory(self.log, (accessory instanceof RademacherSmokeAlarmAccessory ? accessory.accessory : accessory), data, self.session);
                            }
                        }
                        // environment sensor
                        else if(["32000064","32000064_A","32000064_S"].includes(data.deviceNumber))
                        {
                            self.addEnvironmentSensorAccessory(accessory, data);
                        }
                        // temperature sensor
                        else if(["32501812_S"].includes(data.deviceNumber))
                        {
                            if (accessory === undefined) {
                                self.addTemperatureSensorAccessory(data);
                            }
                            else {
                                self.log("temperature sensor is online: %s [%s]", accessory.displayName, data.did);
                                self.accessories[uuid] = new RademacherTemperatureSensorAccessory(self.log, (accessory instanceof RademacherTemperatureSensorAccessory ? accessory.accessory : accessory), data, self.session);
                            }
                        }
                        // door/window sensor
                        else if(["32003164"].includes(data.deviceNumber))
                        {
                            self.log("Unknown product: %s (but door/window sensor coming soon...)",data.deviceNumber);
                            self.log(data);
                        }                    
                        // unknown
                        else
                        {
                        self.log("Unknown product: %s",data.deviceNumber);
                        self.log(data);
                        }
                    });
                }
                else
                {
                    self.log("No meters found in %s",body);
                }
            };
            self.session.login(function(e) {
                if(e) throw new Error("Login failed: "+e);
                self.session.get("/v4/devices?devtype=Actuator", 5000, handleActuators);
                self.session.get("/v4/devices?devtype=Sensor", 5000, handleSensors);
            });
        }.bind(this));
    }
}

RademacherHomePilot.prototype.configureAccessory = function(accessory) {
    this.accessories[accessory.UUID] = accessory;
};

RademacherHomePilot.prototype.addBlindsAccessory = function(blind) {
    this.log("Found blinds: %s - %s [%s]", blind.name, blind.description, blind.did);

    var name = null;
    if(!blind.description.trim())
        name = blind.name;
    else
        name = blind.description;
    var accessory = new global.Accessory(name, UUIDGen.generate("did"+blind.did));
    accessory.addService(global.Service.WindowCovering, name);
    this.accessories[accessory.UUID] = new RademacherBlindsAccessory(this.log, accessory, blind, this.session, this.inverted);
    this.api.registerPlatformAccessories("homebridge-rademacher-homepilot", "RademacherHomePilot", [accessory]);
    this.log("Added blinds: %s - %s [%s]", blind.name, blind.description, blind.did);
};

RademacherHomePilot.prototype.addSmokeAlarmAccessory = function(sensor) {
    this.log("Found smoke alarm: %s - %s [%s]", sensor.name, sensor.description, sensor.did);

    var name = null;
    if(!sensor.description.trim())
        name = sensor.name;
    else
        name = sensor.description;
    var accessory = new global.Accessory(name, UUIDGen.generate("did"+sensor.did));
    accessory.addService(global.Service.SmokeSensor, name);
    this.accessories[accessory.UUID] = new RademacherSmokeAlarmAccessory(this.log, accessory, sensor, this.session);
    this.api.registerPlatformAccessories("homebridge-rademacher-homepilot", "RademacherHomePilot", [accessory]);
    this.log("Added smoke alarm: %s - %s [%s]", sensor.name, sensor.description, sensor.did);
};

RademacherHomePilot.prototype.addEnvironmentSensorAccessory = function(accessoryIn, sensor) {
    this.log("Found environment sensor: %s - %s [%s]", sensor.name, sensor.description, sensor.did);

    var name = null;
    if(!sensor.description.trim())
        name = sensor.name;
    else
        name = sensor.description;

    var accessory = null
    if (accessoryIn === undefined)
    {
        this.log("Found environment sensor: new accessory")
        accessory = new global.Accessory(name, UUIDGen.generate("did"+sensor.did));
        accessory.addService(global.Service.WindowCovering, name);
        accessory.addService(global.Service.TemperatureSensor, name);
        accessory.addService(global.Service.LightSensor, name);
        this.api.registerPlatformAccessories("homebridge-rademacher-homepilot", "RademacherHomePilot", [accessory]);
    }
    else if (accessoryIn instanceof RademacherEnvironmentSensorAccessory)
    {
        accessory = accessoryIn.accessory;
    }
    else
    {
        accessory = accessoryIn
    }
    if (!(this.accessories[accessory.UUID] instanceof RademacherEnvironmentSensorAccessory))
    {
        this.accessories[accessory.UUID] = new RademacherEnvironmentSensorAccessory(this.log, accessory, sensor, this.session, this.inverted);
    }
    this.log("Added environment sensor: %s - %s [%s]", sensor.name, sensor.description, sensor.did);
};

RademacherHomePilot.prototype.addTemperatureSensorAccessory = function(sensor) {
    this.log("Found temperature sensor: %s - %s [%s]", sensor.name, sensor.description, sensor.did);

    var name = null;
    if(!sensor.description.trim())
        name = sensor.name;
    else
        name = sensor.description;
    var accessory = new global.Accessory(name, UUIDGen.generate("did"+sensor.did));
    accessory.addService(global.Service.TemperatureSensor, name);
    this.accessories[accessory.UUID] = new RademacherTemperatureSensorAccessory(this.log, accessory, sensor, this.session);
    this.api.registerPlatformAccessories("homebridge-rademacher-homepilot", "RademacherHomePilot", [accessory]);
    this.log("Added temperature sensor: %s - %s [%s]", sensor.name, sensor.description, sensor.did);
};

RademacherHomePilot.prototype.addDimmerAccessory = function(dimmer) {
    this.log("Found dimmer: %s - %s [%s]", dimmer.name, dimmer.description, dimmer.did);

    var name = null;
    if(!dimmer.description.trim())
        name = dimmer.name;
    else
        name = dimmer.description;
    var accessory = new global.Accessory(name, UUIDGen.generate("did"+dimmer.did));
    accessory.addService(global.Service.Lightbulb, name);
    this.accessories[accessory.UUID] = new RademacherDimmerAccessory(this.log, accessory, dimmer, this.session);
    this.api.registerPlatformAccessories("homebridge-rademacher-homepilot", "RademacherHomePilot", [accessory]);
    this.log("Added dimmer: %s - %s [%s]", dimmer.name, dimmer.description, dimmer.did);
};

RademacherHomePilot.prototype.addThermostatAccessory = function(thermostat) {
    this.log("Found thermostat: %s - %s [%s]", thermostat.name, thermostat.description, thermostat.did);

    var name = null;
    if(!thermostat.description.trim())
        name = thermostat.name;
    else
        name = thermostat.description;
    var accessory = new global.Accessory(name, UUIDGen.generate("did"+thermostat.did));
    accessory.addService(global.Service.Thermostat, name);
    this.accessories[accessory.UUID] = new RademacherThermostatAccessory(this.log, accessory, thermostat, this.session);
    this.api.registerPlatformAccessories("homebridge-rademacher-homepilot", "RademacherHomePilot", [accessory]);
    this.log("Added thermostat: %s - %s [%s]", thermostat.name, thermostat.description, thermostat.did);
};

RademacherHomePilot.prototype.addSwitchAccessory = function(sw) {
    this.log("Found switch: %s - %s [%s]", sw.name, sw.description, sw.did);

    var name = null;
    if(!sw.description.trim())
        name = sw.name;
    else
        name = sw.description;
    var accessory = new global.Accessory(name, UUIDGen.generate("did"+sw.did));
    accessory.addService(global.Service.Switch, name);
    this.accessories[accessory.UUID] = new RademacherSwitchAccessory(this.log, accessory, sw, this.session);
    this.api.registerPlatformAccessories("homebridge-rademacher-homepilot", "RademacherHomePilot", [accessory]);
    this.log("Added switch: %s - %s [%s]", sw.name, sw.description, sw.did);
};

RademacherHomePilot.prototype.addLockAccessory = function(sw) {
    this.log("Found lock: %s - %s [%s]", sw.name, sw.description, sw.did);

    var name = null;
    if(!sw.description.trim())
        name = sw.name;
    else
        name = sw.description;
    var accessory = new global.Accessory(name, UUIDGen.generate("did"+sw.did));
    accessory.addService(global.Service.LockMechanism, name);
    this.accessories[accessory.UUID] = new RademacherLockAccessory(this.log, accessory, sw, this.session);
    this.api.registerPlatformAccessories("homebridge-rademacher-homepilot", "RademacherHomePilot", [accessory]);
    this.log("Added lock: %s - %s [%s]", sw.name, sw.description, sw.did);
};

RademacherHomePilot.prototype.removeAccessory = function(accessory) {
    if (accessory) {
        this.log("[" + accessory.description + "] Removed from HomeBridge.");
        if (this.accessories[accessory.UUID]) {
            delete this.accessories[accessory.UUID];
        }
        this.api.unregisterPlatformAccessories("homebridge-rademacher-homepilot", "RademacherHomePilot", [accessory]);
    }
};

