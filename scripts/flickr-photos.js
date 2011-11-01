function rand(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}

function debug() {
	if (DEBUG) console.log.apply(console, arguments);
}

if (!Detector.webgl) {
	Detector.addGetWebGLMessage();
}
else {
	var globe = new DAT.Globe('world-black', document.getElementById('container'), function(x) {
	    	var c = new THREE.Color();
	    	c.setHSV(0.55 + (x / 2), 1, 0.85 + (x * 0.3));
	    	return c;
	    }),
	    socket = io.connect('http://nolancaudill.com:1361/'),
	    points = {},
	    STEPS  = 23,
	    DEBUG  = false;
	
	globe.animate();
	
	socket.on('connect', function initSocket() {
		socket.emit('subscribe', { events: ['nolansflickrdemo'] });
	});
	
	socket.on('publish', function receiveData(data) {
		var raw = data.raw,
		    lat = Math.round(raw['geo:lat']),
		    lon = Math.round(raw['geo:long']),
		    k;
		
		// Make sure we have the goods
		if (isNaN(lat) || isNaN(lon) || (lat === 0 && lon === 0)) { return; }
		
		k         = lat + '|' + lon;
		points[k] = points[k] ? points[k] + 1 : 1;
		
		strength = Math.min(0.75, 1 - (1 / (0.1 * Math.pow(points[k], 1.2) + 1)));
		
		globe.addData([lat, lon, strength], { format: 'magnitude' });
		globe.createPoints();
	});
}
