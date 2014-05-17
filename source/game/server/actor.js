var Geometry = require('../../sra/src/util/geometry.js');

var Types = {
	PLAYER: 1,
	BULLET: 2,
	ASTEROID: 3
}

var Actor = {
	_init: function (id, type, game) {
		this.id = id;
		this.type = type;
		this.game = game;
		this.initiated = false;
		this.updated = false;

		this.position = Geometry.Vector2.Zero.clone();
		this.width = 0;
		this.height = 0;
		this.diagonal = 0;
		this.polygon = null;
		this.rotation = 0;

		this.alive = true;
	},

	toMessage: function (full) {
		return {};
	},

	update: function () {

	},

	destroy: function () {

	}
}

var PlayerActor = function (id, game, data) {
	this._init(id, Types.PLAYER, game);
	this.client = data.client;
	this.color = data.color;

	this.width = 44.0;
	this.height = 23.0;
	this.diagonal = Math.sqrt(this.width * this.width + this.height * this.height);
	this.polygon = new Geometry.Polygon2(PlayerActor.polygonPoints);

	this.game.positionPlayerOnField(this);
	this.polygon.transform(this.position.x, this.position.y, this.rotation);

	this.movementSpeed = 5.0;
	this.rotationSpeed = Geometry.degreesToRadians(4.0);

	this.thrust = 0;
	this.torque = 0;
	this.velocity = Geometry.Vector2.Zero.clone();
	this.desiredVelocity = Geometry.Vector2.Zero.clone();
	this.steering = Geometry.Vector2.Zero.clone();
	this.mass = 30;

	this.damage = 300;

	this.timeOfDeath = 0;
	this.health = 250;

	this.invincibilityStartTime = 0;
	this.invincibilityDuration = 3000; // in milliseconds
	this.invincible = false;

	this.becomeInvincible();
}

PlayerActor.prototype = Object.create(Actor);

PlayerActor.polygonPoints = [
	new Geometry.Vector2(-10.5, -20.0),
	new Geometry.Vector2(-9.5, -22.0),
	new Geometry.Vector2(9.5, -3.0),
	new Geometry.Vector2(9.5, 3.0),
	new Geometry.Vector2(-9.5, 22.0),
	new Geometry.Vector2(-10.5, 20.0)
];

PlayerActor.prototype.toMessage = function (full) {
	if (full) {
		return {
			id: this.id,
			t: this.type,
			c: this.color,
			x: this.position.x,
			y: this.position.y,
			w: this.width,
			h: this.height,
			r: this.rotation,
			hp: this.health,
			i: this.invincible
		};
	}

	return {
		id: this.id,
		x: this.position.x,
		y: this.position.y,
		r: this.rotation,
		hp: this.health,
		i: this.invincible
	};
}

PlayerActor.prototype.update = function () {
	var updated = false;
	var moved = false;

	this.desiredVelocity = new Geometry.Vector2(1.0, 0.0).rotate(this.rotation).multiply(this.movementSpeed * this.thrust);

	if (!this.desiredVelocity.equals(Geometry.Vector2.Zero) || !this.velocity.equals(Geometry.Vector2.Zero)) {
		this.steering = this.desiredVelocity.minus(this.velocity);
		this.steering.multiply(1.0 / this.mass);
		this.velocity.addVector(this.steering);
		this.position.addVector(this.velocity);
		this.game.wrapPosition(this);
		moved = true;
	}

	if (this.torque) {
		var rotation = this.rotationSpeed * this.torque;

		if (this.thrust < 0) {
			rotation *= -1;
		}

		this.rotation += rotation;
		moved = true;
	}

	if (this.invincible && Date.now() - this.invincibilityStartTime >= this.invincibilityDuration) {
		this.invincible = false;
		updated = true;
	}

	if (moved) {
		this.polygon.transform(this.position.x, this.position.y, this.rotation);
	}

	this.updated = updated || moved;
}

PlayerActor.prototype.becomeInvincible = function () {
	this.invincible = true;
	this.invincibilityStartTime = Date.now();
}

PlayerActor.prototype.hit = function (damage) {
	this.health -= damage;

	if (this.health <= 0) {
		this.destroy();
		return true;
	}

	return false;
}

PlayerActor.prototype.destroy = function () {
	this.alive = false;
	this.health = 0;
	this.timeOfDeath = Date.now();
}

var BulletActor = function (id, game, data) {
	this._init(id, Types.BULLET, game);

	this.owner = data.owner;

	this.position.x = this.owner.position.x;
	this.position.y = this.owner.position.y;
	this.rotation = this.owner.rotation;
	this.width = 10;
	this.height = 10;
	this.diagonal = Math.sqrt(this.width * this.width + this.height * this.height);
	this.polygon = new Geometry.Polygon2(BulletActor.polygonPoints);
	this.polygon.transform(this.position.x, this.position.y, this.rotation);

	this.damage = 70;
	this.speed = 10;
	this.velocity = new Geometry.Vector2(1.0, 0.0).rotate(this.rotation).multiply(this.speed);
	this.spawnTime = Date.now();
	this.timeToLive = 2000; // in milliseconds
}

BulletActor.prototype = Object.create(Actor);

BulletActor.polygonPoints = [
	new Geometry.Vector2(-8.0, -8.0),
	new Geometry.Vector2(8.0, -8.0),
	new Geometry.Vector2(8.0, 8.0),
	new Geometry.Vector2(-8.0, 8.0)
];

BulletActor.prototype.toMessage = function (full) {
	if (full) {
		return {
			id: this.id,
			t: this.type,
			x: this.position.x,
			y: this.position.y,
			w: this.width,
			h: this.height,
			r: this.rotation
		};
	}

	return {
		id: this.id,
		x: this.position.x,
		y: this.position.y
	};
}

BulletActor.prototype.update = function () {
	this.position.addVector(this.velocity);
	this.game.wrapPosition(this);
	this.polygon.transform(this.position.x, this.position.y, this.rotation);
	this.updated = true;

	if (Date.now() - this.spawnTime >= this.timeToLive) {
		this.destroy();
	}
}

BulletActor.prototype.destroy = function () {
	this.alive = false;
}

var AsteroidActor = function (id, game, data) {
	this._init(id, Types.ASTEROID, game);

	if (data.color) {
		this.color = data.color;
	} else {
		this.color = AsteroidActor.colors[Math.round(Math.random() * (AsteroidActor.colors.length - 1))];
	}

	if (data.subtype > AsteroidActor.maxSubtype) {
		this.subtype = AsteroidActor.maxSubtype;
	} else if (data.subtype < AsteroidActor.minSubtype) {
		this.subtype = AsteroidActor.minSubtype;
	} else {
		this.subtype = data.subtype;
	}

	this.polygon = new Geometry.Polygon2(AsteroidActor.polygonPointsBySubtype[this.subtype]);

	this.width = AsteroidActor.sizesBySubtype[this.subtype][0];
	this.height = AsteroidActor.sizesBySubtype[this.subtype][1];
	this.diagonal = Math.sqrt(this.width * this.width + this.height * this.height);

	if (data.x && data.y && data.rotation) {
		this.position.x = data.x;
		this.position.y = data.y;
		this.rotation = data.rotation;
	} else {
		game.positionAsteroidOnField(this);
	}

	this.polygon.transform(this.position.x, this.position.y, this.rotation);

	this.health = AsteroidActor.healthBySubtype[this.subtype];
	this.damage = AsteroidActor.damageBySubtype[this.subtype];
	this.movementSpeed = Math.random() + 1.0;
	this.rotationSpeed = Math.random() * 2.0;

	if (data.direction) {
		this.velocity = data.direction.multiply(this.movementSpeed);
	} else {
		this.velocity = new Geometry.Vector2(1.0, 0.0).rotate(this.rotation).multiply(this.movementSpeed);
	}
	
	this.torque = Geometry.degreesToRadians(this.rotationSpeed * 1.0);

	this.split = false;
}

AsteroidActor.prototype = Object.create(Actor);

AsteroidActor.minSubtype = 0;
AsteroidActor.maxSubtype = 1;

AsteroidActor.sizesBySubtype = [[32.0, 32.0], [64.0, 64.0]];

AsteroidActor.healthBySubtype = [100, 280];

AsteroidActor.damageBySubtype = [250, 300];

AsteroidActor.colors = ['green', 'gray', 'orange', 'red'];

AsteroidActor.polygonPointsBySubtype = [[
	new Geometry.Vector2(-15.0, -7.0),
	new Geometry.Vector2(0.0, -14.0),
	new Geometry.Vector2(6.0, -14.0),
	new Geometry.Vector2(14.0, -4.0),
	new Geometry.Vector2(14.0, 4.0),
	new Geometry.Vector2(2.0, 15.0),
	new Geometry.Vector2(-7.0, 15.0),
	new Geometry.Vector2(-15.0, 3.0)
],
[
	new Geometry.Vector2(-30.0, -8.0),
	new Geometry.Vector2(-15.0, -25.0),
	new Geometry.Vector2(2.0, -29.0),
	new Geometry.Vector2(16.0, -26.0),
	new Geometry.Vector2(29.0, -6.0),
	new Geometry.Vector2(24.0, 16.0),
	new Geometry.Vector2(12.0, 16.0),
	new Geometry.Vector2(-10.0, 29.0),
	new Geometry.Vector2(-22.0, 16.0),
	new Geometry.Vector2(-30.0, 18.0)
]];

AsteroidActor.prototype.toMessage = function (full) {
	if (full) {
		return {
			id: this.id,
			t: this.type,
			st: this.subtype,
			c: this.color,
			x: this.position.x,
			y: this.position.y,
			w: this.width,
			h: this.height,
			r: this.rotation
		};
	}

	return {
		id: this.id,
		x: this.position.x,
		y: this.position.y,
		r: this.rotation
	}
}

AsteroidActor.prototype.update = function () {
	this.position.addVector(this.velocity);
	this.game.wrapPosition(this);
	this.rotation += this.torque;
	this.polygon.transform(this.position.x, this.position.y, this.rotation);
	this.updated = true;
}

AsteroidActor.prototype.hit = function (damage) {
	this.health -= damage;

	if (this.health <= 0) {
		this.destroy();
		return true;
	}

	return false;
}

AsteroidActor.prototype.destroy = function () {
	this.alive = false;
}

exports.Types = Types;
exports.PlayerActor = PlayerActor;
exports.BulletActor = BulletActor;
exports.AsteroidActor = AsteroidActor;