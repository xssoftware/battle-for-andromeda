function showNameEntryDialogue(callback) {
	// Overlay
	var overlay = document.createElement('div');
	overlay.id = 'dialogue';
	overlay.style.position = 'absolute';
	overlay.style.top = '0';
	overlay.style.left = '0';
	overlay.style.bottom = '0';
	overlay.style.width = '100%';
	overlay.style.backgroundColor = '#000';
	overlay.style.opacity = '0.5';

	// Input field and label wrapper
	var wrapper = document.createElement('div');
	wrapper.style.width = '100%';
	wrapper.style.padding = '240px 0px';
	wrapper.style.textAlign = 'center';
	overlay.appendChild(wrapper);

	// Label
	var label = document.createElement('p');
	label.innerHTML = 'Enter a name';
	label.style.color = 'white';
	label.style.fontFamily = 'Tahoma';
	label.style.fontSize = '20px';
	label.style.margin = '10px 0px';
	wrapper.appendChild(label);

	// Input field
	var textField = document.createElement('input');
	textField.type = 'text';
	textField.style.width = '200px';
	textField.style.height = '24px';
	textField.onkeypress = function (event) {
		if (event.keyCode != 13) {
			return true;
		}

		if (!this.value.length) {
			return true;
		}

		callback(this.value);

		return false;
	};

	wrapper.appendChild(textField);

	document.body.appendChild(overlay);
	textField.focus();
}

function hideNameEntryDialogue() {
	var d = document.getElementById('dialogue');
	d.parentNode.removeChild(d);
}

function start() {
	var client = new Client(Config.host, Config.port);
	var canvas = document.getElementsByTagName('canvas')[0];
	client.connect();
	var controller = new GameController(client, canvas, Config.FPS);

	window.pause = function () {
		controller.pause();
	}

	window.resume = function () {
		controller.resume();
	}
}

window.onload = function () {
	document.imageCache = new Graphics.Image.Cache();

	var base = 'res/';
	var imageNames = [
		'space_tl.jpg', 'space_tr.jpg', 'space_bl.jpg', 'space_br.jpg', 
		'ship_blue.png', 'ship_green.png', 'ship_purple.png', 'ship_red.png', 'ship_white.png', 'ship_yellow.png',
		'beam.png',
		'expl1.png', 'expl2.png', 'expl3.png', 'expl4.png', 'expl5.png', 'expl6.png', 
		'expl7.png', 'expl8.png', 'expl9.png', 'expl10.png', 'expl11.png', 'expl12.png',
		'asteroid_0_green.png', 'asteroid_0_white.png', 'asteroid_0_gray.png', 'asteroid_0_orange.png', 'asteroid_0_red.png',
		'asteroid_1_green.png', 'asteroid_1_white.png', 'asteroid_1_gray.png', 'asteroid_1_orange.png', 'asteroid_1_red.png'
	];

	var imagePaths = [];

	for (var i = 0, l = imageNames.length; i < l; i++) {
		imagePaths.push(base + imageNames[i]);
	}

	new Graphics.Image.Loader(imagePaths, document.imageCache, start).start();
}