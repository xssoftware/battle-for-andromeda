var Actor = {
	Types: {
		PLAYER: 1,
		BULLET: 2
	},

	_init: function (id, type, game, updateRate, entity) {
		this.id = id;
		this.type = type;
		this.game = game;
		this.entity = entity || new SRA.Entity();
		this.updateRate = updateRate;
		this.updateStep = 1.0 / updateRate;
	},

	update: function (data, animate) {
	},

	moveEntity: function (position) {
		var oldPosition = this.entity.getPosition();
		var dx = Math.abs(oldPosition.x - position.x);
		var dy = Math.abs(oldPosition.y - position.y);
		var precision = 0.01;

		if (dx > precision || dy > precision) {
			if (this.lastMoveAction) {
				this.lastMoveAction.end(true);
				this.lastMoveAction = null;
			}

			if (dx > this.game.fieldSize.width || dy > this.game.fieldSize.height) {
				this.entity.setPosition(position);
			} else {
				var move = new SRA.MovePositionToAction(position, this.updateStep, 1.0);
				this.entity.addAction(move);
				this.lastMoveAction = move;
			}
		}
	}
}

var PlayerActor = function (id, game, updateRate, entity) {
	this._init(id, Actor.Types.PLAYER, game, updateRate, entity);
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

	this.moveEntity(position);
	
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

var BulletActor = function (id, game, updateRate, entity) {
	this._init(id, Actor.Types.BULLET, game, updateRate, entity);
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

	this.moveEntity(position);
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
