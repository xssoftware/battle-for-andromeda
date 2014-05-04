var Geometry = require('../../sra/src/util/geometry.js');

var Types = {
	PLAYER: 1
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
	},

	toMessage: function (full) {
		return null;
	}
}

var PlayerActor = function (id, game, data) {
	this._init(id, Types.PLAYER, game);
	this.client = data.client;

	this.width = 40.0;
	this.height = 40.0;
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

	this.alive = true;
	this.timeOfDeath = 0;
	this.health = 1000;

	this.invincibilityStartTime = 0;
	this.invincibilityDuration = 3000; // in milliseconds
	this.invincible = false;

	this.becomeInvincible();
}

PlayerActor.prototype = Object.create(Actor);

PlayerActor.polygonPoints = [
	new Geometry.Vector2(-20.0, -20.0),
	new Geometry.Vector2(20.0, -20.0),
	new Geometry.Vector2(20.0, 20.0),
	new Geometry.Vector2(-20.0, 20.0),
];

PlayerActor.prototype.toMessage = function (full) {
	if (full) {
		return {
			id: this.id,
			t: this.type,
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
		t: this.type,
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

PlayerActor.prototype.destroy = function () {
	this.alive = false;
	this.health = 0;
	this.timeOfDeath = Date.now();
}

exports.Types = Types;
exports.PlayerActor = PlayerActor;