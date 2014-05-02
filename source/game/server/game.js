var Dispatch = require('../../sra/src/util/dispatch.js');

var Game = function (server, updateRate) {
	this.server = server;
	this.updateRate = updateRate;
	this.runLoop = new Dispatch.RunLoop(updateRate, this.update, this);

	this.fieldSize = {width: 600, height: 400};

	this.runLoop.start();
};

Game.prototype.update = function (context) {
	var self = context;
	self.server.updateClients();
	self.server.updateActors();
};

Game.prototype.toMessage = function () {
	return {
		w: this.fieldSize.width,
		h: this.fieldSize.height,
		ur: this.updateRate
	};
};

module.exports = Game;