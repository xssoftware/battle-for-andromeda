(function (exports) {
	exports.INIT = 1;
	exports.NAME = 2;

	exports.GAME_DATA = 16;

	exports.ACTOR_ADD = 32;
	exports.ACTOR_UPDATE = 33;

	exports.buildInitMessage = function () {
		return {type: exports.INIT};
	};

	exports.buildNameMessage = function (name) {
		return {type: exports.NAME, name: name};
	};

	exports.buildGameDataMessage = function (data) {
		return {type: exports.GAME_DATA, data: data};
	};

	exports.buildActorAddMessage = function (data) {
		return {type: exports.ACTOR_ADD, data: data};
	};

	exports.buildActorUpdateMessage = function (data) {
		return {type: exports.ACTOR_UPDATE, data: data};
	};
})(typeof exports === 'undefined' ? this.Message = {} : exports);