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
	
	var container = document.getElementById('container'),
		globe  = new DAT.Globe(container),
		socket = io.connect('http://nolancaudill.com:1361/'),
		points = {},
		STEPS  = 23,
		FUDGE, LIMIT,
		
		DEBUG = true;
	
	globe.animate();
	
	// Hacky way to make the world spin
	// setInterval(function() {
	// 	target.x += 4;
	// 	globe.animate();
	// }, 10000);
	
	socket.on('connect', function() {
		socket.emit('subscribe', { events: ['nolansflickrdemo'] });
	});
	
	socket.on('publish', function(data) {
		var raw = data.raw,
		    lat = Math.round(raw['geo:lat']),
		    lon = Math.round(raw['geo:long']),
		    k;
		
		// Make sure we have the goods
		if (isNaN(lat) || isNaN(lon) || (lat === 0 && lon === 0)) { return; }
		
		k         = lat + '|' + lon;
		points[k] = points[k] ? points[k] + 1 : 1;
	});
	
	setInterval(function() {
		var keys = Object.keys(points),
		    data = [],
		    i, len, key, ll;
		
		debug('examining points')
		
		for (i = 0, len = keys.length; i < len; i++) {
			key = keys[i];
			ll  = key.split('|');
			
			debug('looking at', ll)
			
			FUDGE = rand(0.9, 1.1);
			LIMIT = rand(0.65, 0.75);
			
			strength = Math.min(FUDGE * points[key] / STEPS, LIMIT);
			
			debug('strength is', strength)
			
			data.push(ll[0], ll[1], strength);
		};
		
		debug('rendering');
		
		// debug('new point', lat, lon, raw);
		// debug('count:', points[k]);
		// debug('strength:', points[k] / STEPS, 'decision:', Math.min(points[k] / STEPS, LIMIT));
		
		globe.addData(data, { format: 'magnitude' });
		
		globe.createPoints();
	}, 1000);
}