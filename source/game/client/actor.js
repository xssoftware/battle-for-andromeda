var Actor = {
	Types: {
		PLAYER: 1,
		BULLET: 2
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
	this.pulseAction = null;

	this.health = 0;
	this.invincible = false;
}

PlayerActor.prototype = Object.create(Actor);

PlayerActor.prototype.update = function (data, animate) {
	this.health = data.hp;
	var invincible = data.i;

	if (this.invincible && !invincible) {
		this.pulseAction.end(true);
		this.entity.opacity = 1.0;
	} else if (!this.invincible && invincible) {
		this.pulseAction = this.createPulseAction();
		this.entity.addAction(this.pulseAction);
	}

	this.invincible = invincible;

	if (data.w) {
		this.entity.rect.size.width = data.w;	
	}
	if (data.h) {
		this.entity.rect.size.height = data.h;
	}

	var position = new Geometry.Vector2(data.x, data.y);
	var rotation = correctedAngle(data.r);

	if (!animate) {
		this.entity.setPosition(position);
		this.entity.rotation = rotation;
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
	
	if (!Geometry.isFloatEqualToFloat(this.entity.rotation, rotation)) {
		var rotate = new SRA.RotateToAction(rotation, this.updateStep, 1.0);
		this.entity.addAction(rotate);

		if (this.lastRotateAction) {
			this.lastRotateAction.end(true);
		}

		this.lastRotateAction = rotate;
	}
}

PlayerActor.prototype.createPulseAction = function () {
	var fadeOut = new SRA.FadeToAction(0.5, 0.5, 1.0);
	var fadeIn = new SRA.FadeToAction(1.0, 0.5, 1.0);
	var group = new SRA.ActionSequence([fadeOut, fadeIn]);
	return new SRA.RepeatAction(group, -1);
}

var BulletActor = function (id, updateRate, entity) {
	this._init(id, Actor.Types.BULLET, updateRate, entity);
	this.entity.backgroundColor = Graphics.Color.random();

	this.lastMoveAction = null;
}

BulletActor.prototype = Object.create(Actor);

BulletActor.prototype.update = function (data, animate) {
	if (data.w) {
		this.entity.rect.size.width = data.w;	
	}
	if (data.h) {
		this.entity.rect.size.height = data.h;
	}
	if (data.r) {
		this.entity.rotation = correctedAngle(data.r);
	}

	var position = new Geometry.Vector2(data.x, data.y);

	if (!animate) {
		this.entity.setPosition(position);
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
}

// canvas angle correction
var correction = Math.PI / 2.0;

function correctedAngle(angle) {
	return angle + correction;
}

Actor.constructorByType = {
	1: PlayerActor,
	2: BulletActor
}
