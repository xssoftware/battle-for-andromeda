var Dispatch = require('../../sra/src/util/dispatch.js');
var Actor = require('./actor.js');

var Game = function (server, updateRate) {
	this.server = server;
	this.updateRate = updateRate;
	this.runLoop = new Dispatch.RunLoop(updateRate, this.update, this);

	this.fieldSize = {width: 600, height: 400};

	this.runLoop.start();
}

Game.prototype.update = function (context) {
	var self = context;

	self.updateGame();
	self.server.updateClients();
	self.server.visitActors();
	self.server.broadcast();
}

Game.prototype.toMessage = function () {
	return {
		w: this.fieldSize.width,
		h: this.fieldSize.height,
		ur: this.updateRate
	};
}

Game.prototype.updateGame = function () {
	this.checkPlayerPlayerCollision();
}

Game.prototype.checkPlayerPlayerCollision = function () {
	var playerActors = this.server.getActors(Actor.Types.PLAYER);

	for (var i = 0, length = playerActors.length; i < length; i++) {
		var a1 = playerActors[i];

		if (!a1.alive) {
			continue;
		}

		for (var j = i + 1; j < length; j++) {
			var a2 = playerActors[j];

			if (!a2.alive) {
				continue;
			}

			if (a1.polygon.intersects(a2.polygon)) {
				a1.destroy();
				a2.destroy();
				break;
			}
		}
	}
}

module.exports = Game;