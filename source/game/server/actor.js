var Geometry = require('../../sra/src/util/geometry.js');

var Types = {
	PLAYER: 1,
	BULLET: 2
}

var Actor = {
	_init: function (id, type, game) {
		this.id = id;
		this.type = type;
		this.game = game;
		this.initiated = false;
		this.updated = false;

		this.position = Geometry.Vector2.Zero.clone();;
		this.width = 0;
		this.height = 0;
		this.polygon = null;
		this.rotation = 0;

		this.alive = true;
	},

	toMessage: function (full) {
		return null;
	},

	update: function () {

	}
}

var PlayerActor = function (id, game, data) {
	this._init(id, Types.PLAYER, game);
	this.client = data.client;
	this.color = data.color;

	this.width = 44.0;
	this.height = 23.0;
	this.polygon = new Geometry.Polygon2(PlayerActor.polygonPoints);

	this.game.positionPlayerOnField(this);
	this.polygon.transform(this.position.x, this.position.y, this.rotation);

	this.maxMovementSpeed = 1;
	this.minMovementSpeed = -1;
	this.movementSpeed = 0;
	this.movementStep = 4.0;

	this.maxRotationSpeed = 1;
	this.minRotationSpeed = -1;
	this.rotationSpeed = 0;
	this.rotationStep = Geometry.degreesToRadians(3.0);

	this.timeOfDeath = 0;
	this.health = 1000;

	this.invincibilityStartTime = 0;
	this.invincibilityDuration = 3000; // in milliseconds
	this.invincible = false;

	this.becomeInvincible();
}

PlayerActor.prototype = Object.create(Actor);

PlayerActor.polygonPoints = [
	new Geometry.Vector2(-11.5, -22.0),
	new Geometry.Vector2(-9.5, -22.0),
	new Geometry.Vector2(11.5, -3.0),
	new Geometry.Vector2(11.5, 3.0),
	new Geometry.Vector2(-9.5, 22.0),
	new Geometry.Vector2(-11.5, 22.0)
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

PlayerActor.prototype.limitMovementSpeed = function () {
	if (this.movementSpeed > this.maxMovementSpeed) {
		this.movementSpeed = this.maxMovementSpeed;
	} else if (this.movementSpeed < this.minMovementSpeed) {
		this.movementSpeed = this.minMovementSpeed;
	}
}

PlayerActor.prototype.limitRotationSpeed = function () {
	if (this.rotationSpeed > this.maxRotationSpeed) {
		this.rotationSpeed = this.maxRotationSpeed;
	} else if (this.rotationSpeed < this.minRotationSpeed) {
		this.rotationSpeed = this.minRotationSpeed;
	}
}

PlayerActor.prototype.update = function () {
	this.limitMovementSpeed();
	this.limitRotationSpeed();

	var updated = false;
	var moved = false;

	if (this.movementSpeed) {
		var offset = this.movementSpeed * this.movementStep;
		var direction = new Geometry.Vector2(1.0, 0.0).rotate(this.rotation);
		this.position.addVector(direction.multiply(offset));
		this.game.wrapPosition(this);
		moved = true;
	}

	if (this.rotationSpeed) {
		this.rotation += this.rotationSpeed * this.rotationStep;
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
	}
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
	this.width = 6;
	this.height = 10;
	this.polygon = new Geometry.Polygon2(BulletActor.polygonPoints);
	this.polygon.transform(this.position.x, this.position.y, this.rotation);

	this.damage = 100;
	this.speed = 10;
	this.step = new Geometry.Vector2(1.0, 0.0).rotate(this.rotation).multiply(this.speed);
	this.spawnTime = Date.now();
	this.timeToLive = 2500; // in milliseconds
}

BulletActor.prototype = Object.create(Actor);

BulletActor.polygonPoints = [
	new Geometry.Vector2(-5.0, -3.0),
	new Geometry.Vector2(5.0, -3.0),
	new Geometry.Vector2(5.0, 3.0),
	new Geometry.Vector2(-5.0, 3.0)
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
	this.position.addVector(this.step);
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

exports.Types = Types;
exports.PlayerActor = PlayerActor;
exports.BulletActor = BulletActor;