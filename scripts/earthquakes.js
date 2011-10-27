// http://labs.gmtaz.com/quake/
//
// This is the earthquake one with unique styling of each chart. Each has a disc below it and is a column.

var tempData;
var count = 20;
var newQuakes = 0;
var interval;

function updateData(){
	$.getJSON('json.php?count='+count, function(data){
		if (tempData != null) {
			var td = [];
			for (var i = 0; i < data.length; i += 3) {
				var td0 = data[i];
				var td1 = data[i+1];
				var td2 = data[i+2];
				var add = true;
				
				for (var x = 0; x < tempData.length; x += 3) {
					add = true;
					if (td0 == tempData[x]
					    && td1 == tempData[x+1]
					    && td2 == tempData[x+2]) {
						add = false;
						break;
					}
				}
				if (add) {
					newQuakes++;
					$('#newQuakes').text(newQuakes).css({color:'#66FFFF'}).animate({
						color:'#FFF'
					}, 1200);
					
					tempData.push(td0,td1,td2);
					td.push(td0,td1,td2);
					globe.addData(td, {format: 'magnitude'});
					globe.createPoints();
				}
			}
		}
		else {
			tempData = data;
			globe.addData(tempData, { format: 'magnitude' });
			globe.createPoints();
		}
	});		

}
if (!Detector.webgl) {
	Detector.addGetWebGLMessage();
}
else {
	var container = document.getElementById('container');
	var xhr;	      
	$('.active').removeClass('active');
	$('#count200').addClass('active');
	count = 200;
	tempData = null;
	newQuakes = count;
	$('#newQuakes').text(newQuakes);
	globe = new DAT.Globe(container);
	globe.animate();
	updateData();
	if (interval) { clearInterval(interval); }
	
	interval = setInterval(function(){
		updateData();
	},60000);// 3000000);
}
