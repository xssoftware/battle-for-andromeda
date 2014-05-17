var GameController = function (client, canvas, fps) {
	this.client = client;
	client.controller = this;

	this.initialized = false;
	this.serverUpdateRate = 0;
	this.serverUpdateStep = 0;
	this.lastUpdateTime = 0;
	this.fieldSize = null;

	this.actors = {};

	this.eventObserver = new Input.EventObserver();
	this.eventObserver.startObservingKeyboardEvents();

	this.renderController = new SRA.Controller.getSharedInstance();
	this.renderController.canvas = new Graphics.Canvas(canvas);
	this.renderController.setFrameRate(fps);
	this.renderController.scheduleUpdate(this, this.update);

	var mainScene = this.createMainScene();
	this.renderController.pushScene(mainScene);

	var bg = this.createBackgroundEntity(new Geometry.Rect(Geometry.Vector2.Zero.clone(), this.renderController.canvas.getSize()));
	mainScene.addChild(bg);

	this.renderController.run();
}

GameController.prototype.createMainScene = function () {
	var mainScene = new SRA.Scene();
	mainScene.rect.size = this.renderController.canvas.getSize();
	return mainScene;
}

GameController.prototype.createBackgroundEntity = function (rect) {
	var cache = document.imageCache;
	var images = [
		[cache.imageForKey('res/space_tl.jpg'), cache.imageForKey('res/space_tr.jpg')],
		[cache.imageForKey('res/space_bl.jpg'), cache.imageForKey('res/space_br.jpg')]
	];

	var bg = new SRA.TileEntity(images);
	bg.setContentOffset(new Geometry.Vector2(Math.round(Math.random() * 1024), Math.round(Math.random() * 1024)));
	bg.rect = rect;
	this.renderController.scheduleUpdate(bg, function (delta) {
		bg.setContentOffset(bg.getContentOffset().add(-15.0 * delta, -8.0 * delta));
	});

	return bg;
}

GameController.prototype.initializeWithGameData = function (data) {
	this.fieldSize = {width: data.w, height: data.h};
	this.serverUpdateRate = data.ur;
	this.serverUpdateStep = 1000.0 / data.ur;

	this.initialized = true;
}

GameController.prototype.pause = function () {
	this.renderController.pause();
}

GameController.prototype.resume = function () {
	this.renderController.run();
}

GameController.prototype.update = function (delta) {
	var now = Date.now();

	if (this.initialized && this.client.playing && now - this.lastUpdateTime >= this.serverUpdateStep) {
		var keys = this.getPressedKeys();

		if (keys.length) {
			this.client.sendMessage(Message.buildInputMessage(keys));
		}

		this.lastUpdateTime = now;
	}

	this.client.processMessages();
}

GameController.prototype.getPressedKeys = function () {
	var pressed = [];
	var keys = this.eventObserver.keys;

	if (keys.up) {
		pressed.push('u');
	}
	if (keys.left) {
		pressed.push('l');
	}
	if (keys.down) {
		pressed.push('d');
	}
	if (keys.right) {
		pressed.push('r');
	}
	if (keys.space) {
		pressed.push('sp');
	}
	if (keys.shift) {
		pressed.push('sh');
	}

	return pressed;
}

GameController.prototype.addActor = function (actorData) {
	var constructor = Actor.constructorByType[actorData.t];
	var actor = new constructor(actorData.id, this, this.serverUpdateRate);
	actor.initiate(actorData);
	this.actors[actorData.id] = actor;
	this.renderController.getTopScene().addChild(actor.entity);
}

GameController.prototype.updateActor = function (actorData) {
	var actor = this.actors[actorData.id];

	if (!actor) {
		console.error('!!! internal inconsistency - missing actor with id: ' + actorData.id + ' !!!');
		return;
	}

	actor.update(actorData, true);
}

GameController.prototype.removeActor = function (actorData) {
	var actor = this.actors[actorData.id];

	if (!actor) {
		console.error('!!! internal inconsistency - missing actor with id: ' + actorData.id + ' !!!');
		return;
	}

	actor.destroy();
	delete this.actors[actorData.id];
}
