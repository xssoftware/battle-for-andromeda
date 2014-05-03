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
	var keys = this.keys;

	if (keys) {
		var offset = 0, rotation = 0;

		if (keys.indexOf('W') != -1) {
			offset = this.player.movementSpeed;
		} else if (keys.indexOf('S') != -1) {
			offset = -this.player.movementSpeed;
		}

		if (keys.indexOf('A') != -1) {
			rotation = -this.player.rotationSpeed;
		} else if (keys.indexOf('D') != -1) {
			rotation = this.player.rotationSpeed;
		}

		if (offset) {
			var direction = new Geometry.Vector2(1.0, 0.0).rotate(this.player.rotation);
			this.player.position.add(direction.multiply(offset));
			this.player.updated = true;
		}

		if (rotation) {
			this.player.rotation += rotation;
			this.player.updated = true;
		}

		this.keys = null;
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