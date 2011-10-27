// http://azprogrammer.com/gtugsglobe/
//
// This one does something strange with the colors. And also tweening.

if(!Detector.webgl){
	Detector.addGetWebGLMessage();
} else {

	var years = ['2008','2009','2010','2011'];
	var container = document.getElementById('container');
	var globe = new DAT.Globe(container, function(x) {
		var c = new THREE.Color();
		c.setHSV( ( 0.6 - ( x * 0.5 ) ), 1.0, 1.0 );
		
		if (x == 0) {
			// c.setHSV( 0, 0, 0 );
		}
		else {
			// c.setHSV( 0.8, 1.0, 1.0 );
		}
		
		return c;
	});
	console.log(globe);
	
	var i, tweens = [];

	var settime = function(globe, t) {
		return function() {
			new TWEEN.Tween(globe).to({time: t/years.length},500).easing(TWEEN.Easing.Cubic.EaseOut).start();
			var y = document.getElementById('year'+years[t]);
			if (y.getAttribute('class') === 'year active') {
				return;
			}
			var yy = document.getElementsByClassName('year');
			for(i=0; i<yy.length; i++) {
				yy[i].setAttribute('class','year');
			}
			y.setAttribute('class', 'year active');
		};
	};

	for (var i = 0; i<years.length; i++) {
		var y = document.getElementById('year'+years[i]);
		y.addEventListener('mouseover', settime(globe,i), false);
	}

	TWEEN.start();




	dojo.require('dojo.io.script');

	var meetings = [
	{year:2008, chapters: []},
	{year:2009, chapters: []},
	{year:2010, chapters: []},
	{year:2011, chapters: []}
	];

	var mapData = [];

	dojo.addOnLoad(function(){
		dojo.xhrGet({
			url: 'chapter_events_may_2011.json',
			timeout: 10000,
			callbackParamName: "callback",
			load: function(result){
				chapters = result.chapters;
				console.log(result);
				dojo.forEach(result.chapters,function(chap){
					dojo.forEach(meetings,function(m){
						m.chapters.push({id: chap.id, lat: chap.lat, lon: chap.lon, mCount: 0});
					});
					
					dojo.forEach(chap.events,function(evt){
						dojo.forEach(meetings,function(m){
							if(m.year >= evt){
								var meetingChap;
								dojo.forEach(m.chapters,function(mc){
									if(mc.id == chap.id){
										meetingChap = mc;
									}
								});
								meetingChap.mCount++;
							}
						});
					});					
				});



				dojo.forEach(meetings,function(meeting){
					var row = [];
					row.push('' + meeting.year);
					var yearData = [];
					dojo.forEach(meeting.chapters,function(chap){
						yearData.push(chap.lat);
						yearData.push(chap.lon);
						yearData.push(chap.mCount/50.0);
					});
					row.push(yearData);
					mapData.push(row);
				});

				console.log(mapData);
				var data = mapData;
				window.data = data;
				for (i = 0; i < data.length; i++) {
					globe.addData(data[i][1], {format: 'magnitude', name: data[i][0], animated: true});
				}
				
				globe.createPoints();
				settime(globe,0)();
				globe.animate();
			},
			error: function(e){
				console.info(e);
			},
			
			preventCache: true,
			handleAs: 'json'
		});


	});





}