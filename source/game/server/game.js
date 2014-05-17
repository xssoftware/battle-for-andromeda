var Dispatch = require('../../sra/src/util/dispatch.js');
var Actor = require('./actor.js');
var Geometry = require('../../sra/src/util/geometry.js');

var Game = function (server, updateRate) {
	this.server = server;
	this.updateRate = updateRate;
	this.runLoop = new Dispatch.RunLoop(updateRate, this.update, this);

	this.fieldSize = {width: 600, height: 400};
	this.wrapAroundThreshold = 20;

	this.maxAsteroidsByPlayersCount = [8, 8, 7, 7, 6, 6];
	this.lastAsteroidSpawnTime = 0;
	this.asteroidRespawnTime = 3000; // in milliseconds

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
	this.checkPlayerAsteroidCollisions();
	this.checkBulletAsteroidCollisions();
	this.checkAsteroidAsteroidCollisions();
	this.updateAsteroids();
}

Game.prototype.updateAsteroids = function () {
	var asteroids = this.server.getActors(Actor.Types.ASTEROID);
	var now = Date.now();

	for (var i = 0, l = asteroids.length; i < l; i++) {
		var asteroid = asteroids[i];

		if (asteroid.alive || asteroid.split || !asteroid.subtype) {
			continue;
		}

		asteroid.split = true;

		var diagonal = asteroid.diagonal;
		var r1 = Math.random() * Math.PI;
		var r2 = Math.random() * Math.PI;
		var direction = new Geometry.Vector2(1.0, 0.0).rotate(r1);
		var offset = direction.times(diagonal / 4.0);

		this.server.addActor(Actor.AsteroidActor, {
			subtype: asteroid.subtype - 1, 
			color: asteroid.color, 
			rotation: r1,
			x: asteroid.position.x + offset.x,
			y: asteroid.position.y + offset.y,
			direction: direction
		});

		this.server.addActor(Actor.AsteroidActor, {
			subtype: asteroid.subtype - 1, 
			color: asteroid.color, 
			rotation: r2,
			x: asteroid.position.x - offset.x,
			y: asteroid.position.y - offset.y,
			direction: direction.opposite()
		});

		this.lastAsteroidSpawnTime = now;
	}

	asteroids = this.server.getActors(Actor.Types.ASTEROID);

	if (asteroids.length <= this.maxAsteroidsByPlayersCount[this.server.numberOfClients] && 
		now - this.lastAsteroidSpawnTime >= this.asteroidRespawnTime) {
		this.server.addActor(Actor.AsteroidActor, {subtype: Math.round(Math.random() * Actor.AsteroidActor.maxSubtype)});
		this.lastAsteroidSpawnTime = now;
	}
}

Game.prototype.checkAsteroidAsteroidCollisions = function () {
	var asteroidActors = this.server.getActors(Actor.Types.ASTEROID);

	for (var i = 0, l = asteroidActors.length; i < l; i++) {
		var a1 = asteroidActors[i];

		if (!asteroidIsCollidable(a1)) {
			continue;
		}

		var a2 = this.collisionActorForActor(asteroidActors, i + 1, a1, asteroidIsCollidable);

		if (a2) {
			a1.hit(a2.damage);
			a2.hit(a1.damage);
		}
	}
}

Game.prototype.checkBulletAsteroidCollisions = function () {
	var bulletActors = this.server.getActors(Actor.Types.BULLET);
	var asteroidActors = this.server.getActors(Actor.Types.ASTEROID);

	if (!asteroidActors.length) {
		return;
	}

	for (var i = 0, length = bulletActors.length; i < length; i++) {
		var b = bulletActors[i];

		if (!bulletIsCollidable(b)) {
			continue;
		}

		var a = this.collisionActorForActor(asteroidActors, 0, b, asteroidIsCollidable);

		if (a) {
			b.destroy();
			a.hit(b.damage);
		}
	}
}

Game.prototype.checkPlayerAsteroidCollisions = function () {
	var playerActors = this.server.getActors(Actor.Types.PLAYER);
	var asteroidActors = this.server.getActors(Actor.Types.ASTEROID);

	if (!asteroidActors.length) {
		return;
	}

	for (var i = 0, length = playerActors.length; i < length; i++) {
		var p = playerActors[i];

		if (!playerIsCollidable(p)) {
			continue;
		}

		var a = this.collisionActorForActor(asteroidActors, 0, p, asteroidIsCollidable);

		if (a) {
			p.hit(a.damage);
			a.hit(p.damage);
		}
	}
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

		var b = this.collisionActorForActor(bulletActors, 0, p, playerBulletIsCollidable);

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
			a1.hit(a2.damage);
			a2.hit(a1.damage);
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

Game.prototype.wrapPosition = function (actor) {
	var threshold = actor.diagonal / 2.0;
	var w = this.fieldSize.width;
	var h = this.fieldSize.height;

	if (actor.position.x > w + threshold) {
		actor.position.x -= w + (threshold * 2.0);
	} else if (actor.position.x < -threshold) {
		actor.position.x += w + (threshold * 2.0);
	}

	if (actor.position.y > h + threshold) {
		actor.position.y -= h + (threshold * 2.0);
	} else if (actor.position.y < -threshold) {
		actor.position.y += h + (threshold * 2.0);
	}
}

Game.prototype.positionPlayerOnField = function (player) {
	var startX = player.width / 2.0;
	var startY = player.height / 2.0;
	var fieldWidth = this.fieldSize.width - (2.0 * player.width);
	var fieldHeight = this.fieldSize.height - (2.0 * player.height);
	var allPlayers = this.server.getActors(Actor.Types.PLAYER);
	var allAsteroids = this.server.getActors(Actor.Types.ASTEROID);
	var x, y, r;

	do {
		x = startX + Math.round(Math.random() * fieldWidth);
		y = startY + Math.round(Math.random() * fieldHeight);
		r = Math.random() * (Math.PI * 2.0);
		player.polygon.transform(x, y, r);
	} while (this.collisionActorForActor(allPlayers, 0, player, actorIsOverlappable) ||
			 this.collisionActorForActor(allAsteroids, 0, player, actorIsOverlappable));

	player.position.x = x;
	player.position.y = y;
	player.rotation = r;
}

Game.prototype.positionAsteroidOnField = function (asteroid) {
	var diagonal = asteroid.diagonal;
	var minX = -(diagonal / 2.0);
	var minY = minX;
	var fieldWidth = this.fieldSize.width + diagonal;
	var fieldHeight = this.fieldSize.height + diagonal;
	var allPlayers = this.server.getActors(Actor.Types.PLAYER);
	var allAsteroids = this.server.getActors(Actor.Types.ASTEROID);
	var x, y, r;

	do {
		if (Math.random() % 2) {
			x = minX;
			y = minY + (Math.random() * fieldHeight);
		} else {
			x = minX + (Math.random() * fieldWidth);
			y = minY;
		}

		r = Math.random() * (Math.PI * 2.0);
		asteroid.polygon.transform(x, y, r);
	} while (this.collisionActorForActor(allPlayers, 0, asteroid, actorIsOverlappable) ||
			 this.collisionActorForActor(allAsteroids, 0, asteroid, actorIsOverlappable));

	asteroid.position.x = x;
	asteroid.position.y = y;
	asteroid.rotation = r;
}

// utility
function asteroidIsCollidable(asteroid) {
	return asteroid.alive;
}

function playerIsCollidable(player) {
	return player.alive && !player.invincible;
}

function playerBulletIsCollidable(bullet, player) {
	return bullet.alive && bullet.owner.id != player.id;
}

function bulletIsCollidable(bullet) {
	return bullet.alive;
}

function actorIsOverlappable(actor) {
	return !actor.alive;
}

module.exports = Game;