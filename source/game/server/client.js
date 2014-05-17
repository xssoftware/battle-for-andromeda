var BISON = require('bison');
var Message = require('../message.js');
var Actor = require('./actor.js');
var Geometry = require('../../sra/src/util/geometry.js');
var WebSocket = require('ws');

var AvailableColors = ['red', 'blue', 'green', 'purple', 'yellow'];

var Client = function (server, connection, clientID) {
	this.id = clientID;
	this.server = server;
	this.conn = connection;
	this.name = null;
	this.player = null;

	var colorIndex = Math.round(Math.random() * (AvailableColors.length - 1));
	this.color = AvailableColors[colorIndex];
	AvailableColors.splice(colorIndex, 1);

	this.unprocessedMessages = [];

	this.started = false;

	this.keys = null;

	this.respawnTime = 4000; // in miliseconds

	this.lastBulletShotTime = 0;
	this.bulletShootCooldownTime = 200; // in milliseconds
}

Client.prototype.update = function () {
	if (!this.player) {
		return;
	}

	if (!this.player.alive) {
		if (Date.now() - this.player.timeOfDeath >= this.respawnTime) {
			this.player = this.server.addActor(Actor.PlayerActor, {client: this, color: this.color});
		}
		return;
	}

	var keys = this.keys;

	if (keys) {
		if (keys.indexOf('u') != -1) {
			this.player.thrust = 1;
		} else if (keys.indexOf('d') != -1) {
			this.player.thrust = -1;
		} else {
			this.player.thrust = 0;
		}

		if (keys.indexOf('l') != -1) {
			this.player.torque = -1;
		} else if (keys.indexOf('r') != -1) {
			this.player.torque = 1;
		} else {
			this.player.torque = 0;
		}

		if (keys.indexOf('sp') != -1) {
			var now = Date.now();

			if (now - this.lastBulletShotTime >= this.bulletShootCooldownTime) {
				this.lastBulletShotTime = now;
				this.server.addActor(Actor.BulletActor, {owner: this.player});
			}
		}

		this.keys = null;
	} else {
		this.player.thrust = 0;
		this.player.torque = 0;
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
				this.player = this.server.addActor(Actor.PlayerActor, {client: this, color: this.color});
			}
			break;

		case Message.INPUT:
			if (this.player && this.player.alive) {
				this.keys = message.data;
			}
			break;

		default:
			break;
	}
}

Client.prototype.sendMessage = function (message) {
	if (this.conn.readyState == WebSocket.OPEN) {
		this.conn.send(BISON.encode(message));
	}
}

Client.prototype.sendMessageRaw = function (rawMessage) {
	if (this.conn.readyState == WebSocket.OPEN) {
		this.conn.send(rawMessage);
	}
}

Client.prototype.disconnect = function () {
	if (this.player && this.player.alive) {
		this.player.destroy();
	}

	AvailableColors.push(this.color);
}

module.exports = Client;