var BISON = require('bison');
var Message = require('../message.js');
var Actor = require('./actor.js');
var Geometry = require('../../sra/src/util/geometry.js');

var Client = function (server, connection, clientID) {
	this.id = clientID;
	this.server = server;
	this.conn = connection;
	this.name = null;
	this.player = null;

	this.unprocessedMessages = [];

	this.initiated = false;
	this.started = false;

	this.keys = null;
}

Client.prototype.update = function () {
	if (!this.player) {
		return;
	}

	var keys = this.keys;

	if (keys) {
		if (keys.indexOf('W') != -1) {
			this.player.movementSpeed++;
		} else if (keys.indexOf('S') != -1) {
			this.player.movementSpeed--;
		} else {
			this.decelerateMovement();
		}

		if (keys.indexOf('A') != -1) {
			this.player.rotationSpeed--;
		} else if (keys.indexOf('D') != -1) {
			this.player.rotationSpeed++;
		} else {
			this.decelerateRotation();
		}

		this.keys = null;
	} else {
		this.decelerateMovement();
		this.decelerateRotation();
	}

	this.player.update();
}

Client.prototype.decelerateMovement = function () {
	if (this.player.movementSpeed > 0) {
		this.player.movementSpeed--;
	} else if (this.player.movementSpeed < 0) {
		this.player.movementSpeed++;
	}
}

Client.prototype.decelerateRotation = function () {
	if (this.player.rotationSpeed > 0) {
		this.player.rotationSpeed--;
	} else if (this.player.rotationSpeed < 0) {
		this.player.rotationSpeed++;
	}
}

Client.prototype.handleMessage = function (message) {
	this.unprocessedMessages.push(message);
};

Client.prototype.processMessages = function () {
	var messages = this.unprocessedMessages;
	var length = messages.length;

	while (length--) {
		this.processMessage(messages.shift());
	}
}

Client.prototype.processMessage = function (message) {
	switch (message.type) {
		case Message.NAME:
			if (!this.name && message.name) {
				this.name = message.name;
				this.player = this.server.addActor(Actor.PlayerActor, {client: this});
			}
			break;

		case Message.INPUT:
			this.keys = message.data;
			break;

		default:
			break;
	}
}

Client.prototype.sendMessage = function (message) {
	this.conn.send(BISON.encode(message));
}

Client.prototype.sendMessageRaw = function (rawMessage) {
	this.conn.send(rawMessage);
}

module.exports = Client;