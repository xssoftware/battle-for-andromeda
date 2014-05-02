
var ws = new WebSocket('ws://' + Config.host + ':' + Config.port);

ws.onopen = function () {
	console.log('opened');
	ws.send(BISON.encode({type:Message.INIT}));
	ws.send(BISON.encode({type:Message.NAME, name:'mordek'}));
};

ws.onmessage = function(msg) {
	console.log('received: ' + JSON.stringify(BISON.decode(msg.data)));
};

ws.onerror = ws.onclose = function(e) {
    console.log('closed ' + e);
};
