var Client = function () {
	this.sock = null;
	this.connected = false;
	this.error = false;
	this.controller = null;
	this.playing = false;

	this.unprocessedMessages = [];
}

Client.prototype.connect = function (host, port) {
	if (this.connected) {
		return;
	}

	this.sock = new WebSocket('ws://' + Config.host + ':' + Config.port);
	var self = this;

	this.sock.onopen = function () {
		console.log('connected');
		self.connected = true;
		self.error = false;
		self.handleConnect();
	}

	this.sock.onmessage = function (event) {
		var msg;

		try {
			msg = BISON.decode(event.data);
		} catch (e) {
			console.log('message parse exception: ' + e);
		}
		
		if (!msg || !msg.type) {
			console.log('invalid message format, closing connection');
			self.error = true;
			self.sock.close();
		} else {
			self.handleMessage(msg);
		}
	}

	this.sock.onclose = function (event) {
		console.log('connection closed: ' + event);
		self.connected = false;
		self.sock = null;
		self.handleDisconnect(self.error);
	}

	this.sock.onerror = function (event) {
		console.log('connection error: ' + event);
		self.error = true;
		// no need to modify client state here as the 'onclose' handler is automatically invoked after this one
	}
}

Client.prototype.disconnect = function () {
	if (!this.connected) {
		return;
	}

	this.sock.close();
	this.sock = null;
}

Client.prototype.handleConnect = function () {
	this.sendMessage(Message.buildInitMessage());

	var self = this;

	showNameEntryDialogue(function (text) {
		hideNameEntryDialogue();

		if (!self.connected) {
			return;
		}

		self.sendMessage(Message.buildNameMessage(text));
	});
}

Client.prototype.handleDisconnect = function (error) {

}

Client.prototype.handleMessage = function (message) {
	// console.log('handle ' + JSON.stringify(message));
	this.unprocessedMessages.push(message);
}

Client.prototype.processMessages = function () {
	var messages = this.unprocessedMessages;
	var length = messages.length;

	while (length--) {
		this.processMessage(messages.shift());
	}
}

Client.prototype.processMessage = function (message) {
	switch (message.type) {
		case Message.GAME_DATA:
			this.controller.initializeWithGameData(message.data);
			break;

		case Message.GAME_START:
			this.playing = true;
			break;

		case Message.ACTOR_ADD:
			this.controller.addActor(message.data);
			break;

		case Message.ACTOR_UPDATE:
			this.controller.updateActor(message.data);
			break;

		case Message.ACTOR_DESTROY:
			this.controller.updateActor(message.data);
			this.controller.removeActor(message.data);
			break;
	}
}

Client.prototype.sendMessage = function (message) {
	if (!this.connected) {
		return;
	}

	this.sock.send(BISON.encode(message));
}
