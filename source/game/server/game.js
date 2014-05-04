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
	self.server.updateActors();
	self.server.send();
}

Game.prototype.toMessage = function () {
	return {
		w: this.fieldSize.width,
		h: this.fieldSize.height,
		ur: this.updateRate
	};
}

Game.prototype.updateGame = function () {
	this.checkPlayerPlayerCollisions();
	this.checkPlayerBulletCollisions();
}

Game.prototype.checkPlayerBulletCollisions = function () {
	var playerActors = this.server.getActors(Actor.Types.PLAYER);
	var bulletActors = this.server.getActors(Actor.Types.BULLET);

	if (!bulletActors.length) {
		return;
	}

	for (var i = 0, length = playerActors.length; i < length; i++) {
		var p = playerActors[i];

		if (!playerIsCollidable(p)) {
			continue;
		}

		var b = this.collisionActorForActor(bulletActors, 0, p, bulletIsCollidable);

		if (b) {
			b.destroy();
			p.hit(b.damage);
		}
	}
}

Game.prototype.checkPlayerPlayerCollisions = function () {
	var playerActors = this.server.getActors(Actor.Types.PLAYER);

	for (var i = 0, length = playerActors.length; i < length; i++) {
		var a1 = playerActors[i];

		if (!playerIsCollidable(a1)) {
			continue;
		}

		var a2 = this.collisionActorForActor(playerActors, i + 1, a1, playerIsCollidable);

		if (a2) {
			a1.destroy();
			a2.destroy();
		}
	}
}

Game.prototype.collisionActorForActor = function (actors, index, actor, validate) {
	var polygon = actor.polygon;

	for (var i = index, l = actors.length; i < l; i++) {
		var a = actors[i];

		if (validate && !validate(a, actor)) {
			continue;
		}

		if (polygon.intersects(a.polygon)) {
			return a;
		}
	}

	return null;
}

Game.prototype.positionPlayerOnField = function (player) {
	var startX = player.width / 2.0;
	var startY = player.height / 2.0;
	var fieldWidth = this.fieldSize.width - (2.0 * player.width);
	var fieldHeight = this.fieldSize.height - (2.0 * player.height);
	var allPlayers = this.server.getActors(Actor.Types.PLAYER);
	var x, y, r;

	do {
		x = startX + Math.round(Math.random() * fieldWidth);
		y = startY + Math.round(Math.random() * fieldHeight);
		r = Math.random() * (Math.PI * 2.0);
		player.polygon.transform(x, y, r);
	} while (this.collisionActorForActor(allPlayers, 0, player, actorIsOverlappable));

	player.position.x = x;
	player.position.y = y;
	player.rotation = r;
}

// utility
function playerIsCollidable(player) {
	return player.alive && !player.invincible;
}

function bulletIsCollidable(bullet, player) {
	return bullet.alive && bullet.owner.id != player.id;
}

function actorIsOverlappable(actor) {
	return !actor.alive;
}

module.exports = Game;