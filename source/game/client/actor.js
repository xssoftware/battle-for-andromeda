var Actor = {
	Types: {
		PLAYER: 1
	},

	_init: function (id, type, entity) {
		this.id = id;
		this.type = type;
		this.entity = entity || new SRA.Entity();
	},

	update: function (data) {

	}
}

var PlayerActor = function (id, entity) {
	this._init(id, Actor.Types.PLAYER, entity);
}

PlayerActor.prototype = Object.create(Actor);

PlayerActor.prototype.update = function (data) {
	this.entity.rect.size.width = data.w;
	this.entity.rect.size.height = data.h;
	this.entity.setPosition(new Geometry.Vector2(data.x, data.y));
	this.entity.backgroundColor = Graphics.Color.Yellow;
}

Actor.constructorByType = {
	1: PlayerActor
}
