var Geometry = require('../../sra/src/util/geometry.js');

var Types = {
	PLAYER: 1
};

var Actor = {
	_init: function (type, client) {
		this.type = type;
		this.client = client;
		this.initiated = false;
		this.updated = false;

		this.position = Geometry.Vector2.Zero.clone();
	},

	toMessage: function () {
		return null;
	}
};

var PlayerActor = function (data) {
	this._init(Types.PLAYER, data.client);

	this.velocity = 0;
	this.rotation = 0;
};

PlayerActor.prototype = Object.create(Actor);

PlayerActor.prototype.toMessage = function () {
	return {
		x: this.position.x,
		y: this.position.y,
		v: this.velocity,
		r: this.rotation
	};
};

exports.Types = Types;
exports.PlayerActor = PlayerActor;