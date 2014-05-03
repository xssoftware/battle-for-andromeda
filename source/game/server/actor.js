var Geometry = require('../../sra/src/util/geometry.js');

var Types = {
	PLAYER: 1
};

var Actor = {
	_init: function (id, type, client) {
		this.id = id;
		this.type = type;
		this.client = client;
		this.initiated = false;
		this.updated = false;

		// this.position = Geometry.Vector2.Zero.clone();
		this.position = new Geometry.Vector2(100.0, 100.0);
	},

	toMessage: function (full) {
		return null;
	}
};

var PlayerActor = function (id, data) {
	this._init(id, Types.PLAYER, data.client);

	this.movementSpeed = 2;
	this.rotationSpeed = Geometry.degreesToRadians(2.0);
	this.rotation = 0;

	this.width = 50.0;
	this.height = 50.0;
};

PlayerActor.prototype = Object.create(Actor);

PlayerActor.prototype.toMessage = function (full) {
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
		t: this.type,
		x: this.position.x,
		y: this.position.y,
		r: this.rotation
	};
};

exports.Types = Types;
exports.PlayerActor = PlayerActor;