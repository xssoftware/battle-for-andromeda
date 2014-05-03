(function (exports) {
	exports.INIT = 1;
	exports.NAME = 2;
	exports.INPUT = 3;

	exports.GAME_DATA = 16;
	exports.GAME_START = 17;

	exports.ACTOR_ADD = 32;
	exports.ACTOR_UPDATE = 33;
	exports.ACTOR_DESTROY = 34;

	exports.buildInitMessage = function () {
		return {type: exports.INIT};
	};

	exports.buildNameMessage = function (name) {
		return {type: exports.NAME, name: name};
	};

	exports.buildInputMessage = function (data) {
		return {type: exports.INPUT, data: data};
	}

	exports.buildGameDataMessage = function (data) {
		return {type: exports.GAME_DATA, data: data};
	};

	exports.buildGameStartMessage = function () {
		return {type: exports.GAME_START};
	}

	exports.buildActorAddMessage = function (data) {
		return {type: exports.ACTOR_ADD, data: data};
	};

	exports.buildActorUpdateMessage = function (data) {
		return {type: exports.ACTOR_UPDATE, data: data};
	};

	exports.buildActorDestroyMessage = function (data) {
		return {type: exports.ACTOR_DESTROY, data: data};
	}
})(typeof exports === 'undefined' ? this.Message = {} : exports);