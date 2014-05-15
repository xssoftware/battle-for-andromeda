var ws = require('ws');
var BISON = require('bison');
var Message = require('../message.js');
var Client = require('./client.js');
var Game = require('./game.js');
var Actor = require('./actor.js');

var Server = function (options) {
	this.port = options.port || 4242;
	this.numberOfClients = 0;
	this.maxNumberOfClients = 5;

	this.uninitiatedClients = [];
	this.clients = [];
	this.lastClientID = 0;

	this.messagesForBroadcast = [];

	this.actors = {};
	this.lastActorID = 0;

	for (var p in Actor.Types) {
		var type = Actor.Types[p];
		this.actors[type] = [];
	}

	this.game = new Game(this, options.updateRate);

	var self = this;

	this.sock = new ws.Server({port: this.port}, function () {
		console.log('server listening on port ' + self.port + '...');
	});

	this.sock.on('connection', function (connection) {
		console.log('client connection established');

		if (self.numberOfClients >= self.maxNumberOfClients) {
			console.log('maximum number of client connections exceeded, closing connection');
			connection.close();
		}

		connection.on('message', function (msg) {
			var message;

			try {
				message = BISON.decode(msg);
			} catch (e) {
				console.log('message parse exception: ' + e);
			}

			if (!message || !message.type) {
				console.log('message not conforming to protocol, closing connection');
				connection.close();
				return;
			}

			if (!connection.clientID && message.type === Message.INIT) {
				var client = self.addClient(connection);
				connection.clientID = client.id;
			} else if (connection.clientID) {
				var client = self.clients[connection.clientID];

				if (client.started || message.type === Message.NAME) {
					client.handleMessage(message);
				}
			}
		});

		connection.on('error', function (error) {
			console.log('client connection error: ' + error);

			if (connection.clientID) {
				self.removeClient(connection.clientID);
			}			
		});

		connection.on('close', function (code, message) {
			console.log('client closed connection with code: ' + code + ', message: ' + message);

			if (connection.clientID) {
				self.removeClient(connection.clientID);
			}
		});
	});

	this.sock.on('error', function (error) {
		console.log('server error: ' + error);
		self.shutDown();
	});
}

Server.prototype.shutDown = function () {

}

Server.prototype.addClient = function (connection) {
	var id = ++this.lastClientID;
	var client = new Client(this, connection, id);
	this.uninitiatedClients[id] = client;
	return client;
}

Server.prototype.removeClient = function (clientID) {
	var client = this.clients[clientID];

	if (!client) {
		if ((client = this.uninitiatedClients[clientID])) {
			client.disconnect();
			delete this.uninitiatedClients[clientID];
		}
		return;
	}

	client.disconnect();
	delete this.clients[clientID];
}

Server.prototype.updateClients = function () {
	for (var id in this.clients) {
		var client = this.clients[id];

		client.processMessages();
		client.update();

		if (!client.started && client.name) {
			client.sendMessage(Message.buildGameStartMessage());
			client.started = true;
		}
	}
}

Server.prototype.addActor = function (constructor, data) {
	var id = ++this.lastActorID;
	var actor = new constructor(id, this.game, data);
	this.actors[actor.type].push(actor);
	return actor;
}

Server.prototype.updateActors = function () {
	for (var type in this.actors) {
		var group = this.actors[type];
		var length = group.length;

		for (var i = 0; i < length; i++) {
			var actor = group[i];

			if (!actor.initiated) {
				this.emit(Message.buildActorAddMessage(actor.toMessage(true)));
				actor.initiated = true;
			} else {
				actor.update();

				if (!actor.alive) {
					this.emit(Message.buildActorDestroyMessage(actor.toMessage(false)));
					group.splice(i--, 1);
					length--;
				} else if (actor.updated) {
					this.emit(Message.buildActorUpdateMessage(actor.toMessage(false)));
					actor.updated = false;
				}
			}
		}
	}
}

Server.prototype.getActors = function (type) {
	return this.actors[type];
}

Server.prototype.emit = function (message) {
	this.messagesForBroadcast.push(message);
}

Server.prototype.send = function () {
	this.broadcast();
	this.sendInitialUpdate();
}

Server.prototype.sendInitialUpdate = function () {
	var clients = this.uninitiatedClients;

	for (var id in clients) {
		var client = clients[id];

		client.sendMessage(Message.buildGameDataMessage(this.game.toMessage()));

		for (var type in this.actors) {
			var group = this.actors[type];

			// send all actors
			for (var i = 0, l = group.length; i < l; i++) {
				var actor = group[i];
				client.sendMessage(Message.buildActorAddMessage(actor.toMessage(true)));
			}
		}

		this.clients[id] = client;
		delete clients[id];
	}
}

Server.prototype.broadcast = function () {
	var clients = this.clients;
	var messages = this.messagesForBroadcast;
	var ml = messages.length;

	for (var i = 0; i < ml; i++) {
		var message = BISON.encode(messages.shift());

		for (var cid in clients) {
			clients[cid].sendMessageRaw(message);
		}
	}
}

module.exports = Server;
