var BISON = require('bison');
var Message = require('../message.js');
var Actor = require('./actor.js');

var Client = function (server, connection, clientID) {
	this.id = clientID;
	this.server = server;
	this.conn = connection;
	this.name = null;
	this.player = null;

	this.initiated = false;
	this.started = false;
};

Client.prototype.update = function () {

}

Client.prototype.handleMessage = function (message) {
	switch (message.type) {
		case Message.NAME:
			if (!this.name && message.name) {
				this.name = message.name;
				this.player = this.server.addActor(Actor.PlayerActor, {client: this});
			}
			break;

		case Message.INPUT:
			
			break;

		default:
			break;
	}

	return true;
};

Client.prototype.sendMessage = function (message) {
	this.conn.send(BISON.encode(message));
};

module.exports = Client;