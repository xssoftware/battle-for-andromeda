var Actor = {
	Types: {
		PLAYER: 1
	},

	_init: function (id, type, updateRate, entity) {
		this.id = id;
		this.type = type;
		this.entity = entity || new SRA.Entity();
		this.updateRate = updateRate;
		this.updateStep = 1.0 / updateRate;
	},

	update: function (data, animate) {

	}
}

var PlayerActor = function (id, updateRate, entity) {
	this._init(id, Actor.Types.PLAYER, updateRate, entity);
	this.entity.backgroundColor = Graphics.Color.random();
	this.lastMoveAction = null;
	this.lastRotateAction = null;
}

PlayerActor.prototype = Object.create(Actor);

PlayerActor.prototype.update = function (data, animate) {
	if (data.w) {
		this.entity.rect.size.width = data.w;	
	}
	if (data.h) {
		this.entity.rect.size.height = data.h;
	}

	var position = new Geometry.Vector2(data.x, data.y);

	if (!animate) {
		this.entity.setPosition(position);
		this.entity.rotation = data.r;
		return;				
	}

	if (!this.entity.getPosition().equals(position)) {
		var move = new SRA.MovePositionToAction(position, this.updateStep, 1.0);
		this.entity.addAction(move);

		if (this.lastMoveAction) {
			this.lastMoveAction.end(true);
		}

		this.lastMoveAction = move;
	}
	
	if (!Geometry.isFloatEqualToFloat(this.entity.rotation, data.r)) {
		var rotate = new SRA.RotateToAction(data.r, this.updateStep, 1.0);
		this.entity.addAction(rotate);

		if (this.lastRotateAction) {
			this.lastRotateAction.end(true);
		}

		this.lastRotateAction = rotate;
	}
}

Actor.constructorByType = {
	1: PlayerActor
}
