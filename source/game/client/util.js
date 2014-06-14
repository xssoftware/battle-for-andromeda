function showNameEntryDialogue(callback) {
	// Overlay
	var overlay = document.createElement('div');
	overlay.id = 'dialogue';
	overlay.style.position = 'absolute';
	overlay.style.top = '0';
	overlay.style.left = '0';
	overlay.style.bottom = '0';
	overlay.style.width = '100%';
	overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';

	// Input field and label wrapper
	var nameWrapper = document.createElement('div');
	nameWrapper.style.width = '100%';
	nameWrapper.style.padding = '40px 0px';
	nameWrapper.style.textAlign = 'center';
	overlay.appendChild(nameWrapper);

	// Label
	var nameLabel = document.createElement('p');
	nameLabel.innerHTML = 'Enter a name';
	nameLabel.style.color = 'white';
	nameLabel.style.fontFamily = 'Tahoma';
	nameLabel.style.fontSize = '20px';
	nameLabel.style.margin = '10px 0px';
	nameWrapper.appendChild(nameLabel);

	// Input field
	var textField = document.createElement('input');
	textField.type = 'text';
	textField.style.width = '200px';
	textField.style.height = '24px';
	nameWrapper.appendChild(textField);

	var shipLabel = document.createElement('p');
	shipLabel.innerHTML = 'Choose ship type';
	shipLabel.style.textAlign = 'center';
	shipLabel.style.color = 'white';
	shipLabel.style.fontFamily = 'Tahoma';
	shipLabel.style.fontSize = '20px';
	shipLabel.style.margin = '0px 0px';
	overlay.appendChild(shipLabel);

	var shipImageWrapper = document.createElement('div');
	shipImageWrapper.style.width = '168px';
	shipImageWrapper.style.margin = '20px auto';
	shipImageWrapper.style.padding = '0px 0px';
	overlay.appendChild(shipImageWrapper);

	var leftImage = document.imageCache.imageForKey('res/ship_0_red.png');
	var rightImage = document.imageCache.imageForKey('res/ship_1_red.png');
	var leftImageSize = [leftImage.width, leftImage.height];
	var rightImageSize = [rightImage.width, rightImage.height];

	leftImage = leftImage.cloneNode(false);
	rightImage = rightImage.cloneNode(false);

	leftImage.style.padding = ((70.0 - leftImageSize[1]) / 2) + 'px ' + ((80.0 - leftImageSize[0]) / 2) + 'px';
	rightImage.style.padding = ((70.0 - rightImageSize[1]) / 2) + 'px ' + ((80.0 - rightImageSize[0]) / 2) + 'px';
	leftImage.style.margin = '0px auto';
	rightImage.style.margin = '0px auto';

	shipImageWrapper.appendChild(leftImage);
	shipImageWrapper.appendChild(rightImage);

	var buttonWrapper = document.createElement('div');
	buttonWrapper.style.width = '100%';
	buttonWrapper.style.textAlign = 'center';
	buttonWrapper.style.margin = '70px 0px';
	overlay.appendChild(buttonWrapper);

	var button = document.createElement('input');
	button.type = 'submit';
	button.value = 'Start';
	button.style.font = '30px Tahoma';
	button.style.width = '140px';
	buttonWrapper.appendChild(button);

	var selectedShipIndex = -1;

	function setSelectedShipIndex(index) {
		if (selectedShipIndex == index) {
			return;
		}

		var active = '2px solid #517DAB';
		var inactive = '2px solid transparent';

		if (0 == index) {
			leftImage.style.border = active;
			rightImage.style.border = inactive;
		} else if (1 == index) {
			rightImage.style.border = active;
			leftImage.style.border = inactive;
		}

		selectedShipIndex = index;
	}

	leftImage.onmouseup = function (event) {
		setSelectedShipIndex(0);
	};

	rightImage.onmouseup = function (event) {
		setSelectedShipIndex(1);
	};

	button.onclick = function (event) {
		if (!textField.value.length) {
			return;
		}

		callback(textField.value, selectedShipIndex);
	};

	document.body.appendChild(overlay);

	textField.focus();
	setSelectedShipIndex(0);
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
		'ship_0_blue.png', 'ship_0_green.png', 'ship_0_purple.png', 'ship_0_red.png', 'ship_0_white.png', 'ship_0_yellow.png',
		'ship_1_blue.png', 'ship_1_green.png', 'ship_1_purple.png', 'ship_1_red.png', 'ship_1_white.png', 'ship_1_yellow.png',
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