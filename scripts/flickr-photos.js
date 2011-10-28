if (!Detector.webgl) {
	Detector.addGetWebGLMessage();
}
else {
	function rand(min, max) {
		return Math.floor(Math.random() * (max - min)) + min;
	}
	
	function debug() {
		if (DEBUG) console.log.apply(console, arguments);
	}
	
	var globe = new DAT.Globe('world-black', document.getElementById('container'), function(x) {
	    	var c = new THREE.Color();
	    	c.setHSV( ( 1.0 - (x * 0.5) ), 1.0, (0.7 + (x * 0.3)) );
	    	return c;
	    }),
	    socket = io.connect('http://nolancaudill.com:1361/'),
	    points = {},
	    STEPS  = 23,
	    FUDGE, LIMIT,
	    
	    DEBUG = false;
	
	globe.animate();
	
	// Hacky way to make the world spin
	// setInterval(function() {
	// 	target.x += 4;
	// 	globe.animate();
	// }, 10000);
	
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
	});
	
	setInterval(function renderData() {
		var keys = Object.keys(points),
		    data = [],
		    i, len, key, ll;								debug('examining points');
		
		for (i = 0, len = keys.length; i < len; i++) {
			key = keys[i];
			ll  = key.split('|');							debug('looking at', ll);
			
			FUDGE = rand(0.9, 1.1);
			LIMIT = rand(0.65, 0.75);
			
			strength = Math.min(FUDGE * points[key] / STEPS, LIMIT);		debug('strength is', strength);
			
			data.push(ll[0], ll[1], strength);
		};										debug('rendering');
		
		// debug('new point', lat, lon, raw);
		// debug('count:', points[k]);
		// debug('strength:', points[k] / STEPS, 'decision:', Math.min(points[k] / STEPS, LIMIT));
		
		globe.addData(data, { format: 'magnitude' });
		globe.createPoints();
	}, 500);
}