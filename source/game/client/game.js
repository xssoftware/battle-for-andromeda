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

	var mainScene = new SRA.Scene();
	mainScene.backgroundColor = "rgb(150, 150, 150)";
	mainScene.rect.size = this.renderController.canvas.getSize();
	this.renderController.pushScene(mainScene);

	this.renderController.run();
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

	return pressed;
}

GameController.prototype.addActor = function (actorData) {
	var constructor = Actor.constructorByType[actorData.t];
	var actor = new constructor(actorData.id, this.serverUpdateRate);
	actor.update(actorData, false);
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

	actor.entity.removeFromParent();
	delete this.actors[actorData.id];
}
