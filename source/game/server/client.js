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
			this.player = this.server.addActor(Actor.PlayerActor, {client: this});
		}
		return;
	}

	var keys = this.keys;

	if (keys) {
		if (keys.indexOf('u') != -1) {
			this.player.movementSpeed++;
		} else if (keys.indexOf('d') != -1) {
			this.player.movementSpeed--;
		} else {
			this.decelerateMovement();
		}

		if (keys.indexOf('l') != -1) {
			this.player.rotationSpeed--;
		} else if (keys.indexOf('r') != -1) {
			this.player.rotationSpeed++;
		} else {
			this.decelerateRotation();
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
		this.decelerateMovement();
		this.decelerateRotation();
	}
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
			if (this.player && this.player.alive) {
				this.keys = message.data;
			}
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