var Actor = {
	Types: {
		PLAYER: 1,
		BULLET: 2,
		ASTEROID: 3
	},

	_init: function (id, type, game, updateRate, entity) {
		this.id = id;
		this.type = type;
		this.game = game;
		this.entity = entity || new SRA.Entity();
		this.updateRate = updateRate;
		this.updateStep = 1.0 / updateRate;
	},

	initiate: function (data) {

	},

	update: function (data, animate) {

	},

	destroy: function () {
		this.entity.removeFromParent();
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
	this.entity.backgroundColor = Graphics.Color.Clear;

	this.lastMoveAction = null;
	this.lastRotateAction = null;
	this.pulseAction = null;

	this.health = 0;
	this.invincible = false;
}

PlayerActor.prototype = Object.create(Actor);

PlayerActor.prototype.initiate = function (data) {
	this.entity.rect.size.width = data.w;
	this.entity.rect.size.height = data.h;

	this.entity.sprite = document.imageCache.imageForKey('res/ship_' + data.c + '.png');

	this.update(data, false);
}

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

PlayerActor.prototype.destroy = function () {
	var ship = this.entity;

	var profile = new SRA.Entity();
	profile.rect = new Geometry.Rect(Geometry.Vector2.Zero.clone(), ship.rect.size.clone());
	profile.backgroundColor = ship.backgroundColor;
	profile.sprite = document.imageCache.imageForKey('res/ship_white.png');
	profile.opacity = 0.0;
	ship.addChild(profile);

	var fadeIn = new SRA.FadeToAction(1.0, 0.3, 1.0);
	var hide = new SRA.InvocationAction(function () {
		ship.sprite = null;
	});
	var fadeOut = new SRA.FadeToAction(0.0, 0.1, 1.0);
	var remove = new SRA.InvocationAction(function () {
		ship.removeFromParent();
	});

	profile.addAction(new SRA.ActionSequence([fadeIn, hide, fadeOut, remove]));

	var x = Math.random() * 4.0;
	var y = 4.0 - x;

	if (Math.round(Math.random())) {
		x = -x;
	}
	if (Math.round(Math.random())) {
		y = -y;
	}

	var move = new SRA.MoveByAction(new Geometry.Vector2(x, y), 0.4, 1.0);
	ship.addAction(move);
}

var BulletActor = function (id, game, updateRate, entity) {
	this._init(id, Actor.Types.BULLET, game, updateRate, entity);
	this.entity.backgroundColor = Graphics.Color.Clear;
	this.entity.sprite = document.imageCache.imageForKey('res/beam.png');

	this.lastMoveAction = null;
}

BulletActor.prototype = Object.create(Actor);

BulletActor.prototype.initiate = function (data) {
	this.entity.rect.size.width = data.w;
	this.entity.rect.size.height = data.h;
	this.entity.rotation = correctedAngle(data.r);

	this.update(data, false);
}

BulletActor.prototype.update = function (data, animate) {
	var position = new Geometry.Vector2(data.x, data.y);

	if (!animate) {
		this.entity.setPosition(position);
		return;
	}

	this.moveEntity(position);
}

BulletActor.prototype.destroy = function () {
	var entity = this.entity;
	var explosionImages = BulletActor.getExplosionImages();
	var firstImage = explosionImages[0];
	var position = entity.getPosition();

	entity.sprite = firstImage;
	entity.rect.size.width = firstImage.width;
	entity.rect.size.height = firstImage.height;
	entity.setPosition(position);
	entity.rotation = Math.random() * (Math.PI * 2.0);

	var animate = new SRA.SpriteAction(explosionImages, 0.5, 1.0);
	var remove = new SRA.InvocationAction(function () {
		entity.removeFromParent();
	});

	entity.addAction(new SRA.ActionSequence([animate, remove]));
}

BulletActor.getExplosionImages = function () {
	if (!this._animationImages) {
		var c = document.imageCache;
		this._animationImages = [
			c.imageForKey('res/expl1.png'), c.imageForKey('res/expl2.png'), c.imageForKey('res/expl3.png'), 
			c.imageForKey('res/expl4.png'), c.imageForKey('res/expl5.png'), c.imageForKey('res/expl6.png'),
			c.imageForKey('res/expl7.png'), c.imageForKey('res/expl8.png'), c.imageForKey('res/expl9.png'), 
			c.imageForKey('res/expl10.png'), c.imageForKey('res/expl11.png'), c.imageForKey('res/expl12.png')
		];
	}

	return this._animationImages;
}

var AsteroidActor = function (id, game, updateRate, entity) {
	this._init(id, Actor.Types.ASTEROID, game, updateRate, entity);
	this.entity.backgroundColor = null;
}

AsteroidActor.prototype = Object.create(Actor);

AsteroidActor.prototype.initiate = function (data) {
	this.entity.rect.size.width = data.w;
	this.entity.rect.size.height = data.h;

	this.subtype = data.st;
	this.entity.sprite = document.imageCache.imageForKey('res/asteroid_' + data.st + '_' + data.c + '.png');

	var profile = new SRA.Entity();
	profile.rect.origin = Geometry.Vector2.Zero.clone();
	profile.rect.size = this.entity.rect.size;
	profile.backgroundColor = null;
	profile.sprite = document.imageCache.imageForKey('res/asteroid_' + data.st + '_white.png');
	this.entity.addChild(profile);

	var fadeOut = new SRA.FadeToAction(0.0, 0.2);
	var remove = new SRA.InvocationAction(function () {
		this.removeFromParent();
	});

	profile.addAction(new SRA.ActionSequence([fadeOut, remove]));

	this.update(data, false);
}

AsteroidActor.prototype.update = function (data, animate) {
	this.entity.rotation = correctedAngle(data.r);

	var position = new Geometry.Vector2(data.x, data.y);

	if (!animate) {
		this.entity.setPosition(position);
		return;
	}

	this.moveEntity(position);
}

AsteroidActor.prototype.destroy = function () {
	var entity = this.entity;

	var profile = new SRA.Entity();
	profile.rect.origin = Geometry.Vector2.Zero.clone();
	profile.rect.size = entity.rect.size;
	profile.backgroundColor = null;
	profile.sprite = document.imageCache.imageForKey('res/asteroid_' + this.subtype + '_white.png');
	profile.opacity = 0.0;
	entity.addChild(profile);

	var fadeIn = new SRA.FadeToAction(1.0, 0.1);
	var clear = new SRA.InvocationAction(function () {
		entity.sprite = null;
	});
	var fadeOut = new SRA.FadeToAction(0.0, 0.1);
	var remove = new SRA.InvocationAction(function () {
		entity.removeFromParent();
	});
	var scale = new SRA.ScaleToAction(new Geometry.Vector2(1.1, 1.1), 0.2);
	scale.setTimingFunction(SRA.TimingFunction.EaseInOut);

	profile.addAction(new SRA.ActionSequence([fadeIn, clear, fadeOut, remove]));
	entity.addAction(scale);
}

// canvas angle correction
var correction = Math.PI / 2.0;

function correctedAngle(angle) {
	return angle + correction;
}

Actor.constructorByType = {
	1: PlayerActor,
	2: BulletActor,
	3: AsteroidActor
}
