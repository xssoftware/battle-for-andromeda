var ws = require('ws');
var BISON = require('bison');
var Message = require('../message.js');
var Game = require('./game.js');

var Server = function (options) {
	this.port = options.port || 4242;

	this.clients = {};
	this.lastClientID = 0;

	this.gameUpdateRate = options.updateRate;
	this.lastGameID = 0;
	this.games = {};
	this.numberOfGames = 0;
	this.maxNumberOfGames = 4;

	var self = this;

	this.sock = new ws.Server({port: this.port}, function () {
		console.log('server listening on port ' + self.port + '...');
	});

	this.sock.on('connection', function (connection) {
		console.log('client connection established');

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
				var game = self.firstGameWithEmptySlot();

				if (!game) {
					console.log('maximum number of games reached, closing connection');
					connection.close();
					return;
				}

				var id = ++self.lastClientID;
				var client = game.addClient(id, connection);
				connection.clientID = id;
				self.clients[id] = client;
			} else if (connection.clientID) {
				var client = self.clients[connection.clientID];

				if (client.started || message.type === Message.PLAYER) {
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

Server.prototype.firstGameWithEmptySlot = function () {
	for (var id in this.games) {
		var game = this.games[id];

		if (game.canAcceptClients()) {
			return game;
		}
	}

	if (this.numberOfGames < this.maxNumberOfGames) {
		return this.addGame();
	}

	return null;
}

Server.prototype.addGame = function () {
	var id = ++this.lastGameID;
	var game = new Game(id, this.gameUpdateRate);
	this.numberOfGames++;
	this.games[id] = game;
	return game;
}

Server.prototype.removeGame = function (game) {
	game.stop();

	if (this.games[game.id]) {
		this.numberOfGames--;
		delete this.games[game.id];
	}
}

Server.prototype.removeClient = function (clientID) {
	var client = this.clients[clientID];

	if (!client) {
		return;
	}

	var game = client.game;
	game.removeClient(clientID);

	if (!game.numberOfClients) {
		this.removeGame(game);
	}

	delete this.clients[clientID];
}

module.exports = Server;
