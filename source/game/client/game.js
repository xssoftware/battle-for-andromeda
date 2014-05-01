
var ws = new WebSocket('ws://' + Config.host + ':' + Config.port);

ws.onopen = function () {
	console.log('opened');
	ws.send(BISON.encode({type:Message.INIT}));
	ws.send(BISON.encode({type:Message.NAME, name:'mordek'}));
};

ws.onmessage = function(msg) {
	console.log('received');
	var msg = BISON.decode(msg.data);

	console.log(JSON.stringify(msg));
};

ws.onerror = ws.onclose = function(e) {
    console.log('closed ' + e);
};

