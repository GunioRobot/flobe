// http://tcoffee.org/globe-coffee/
//
// This one has random-ish colors for each bar

var globe = DAT.Globe(document.getElementById('container'), function(label) {
	return new THREE.Color([
		0xd9d9d9, 0xb6b4b5, 0x9966cc, 0x15adff, 0x3e66a3, 0x216288,
		0xff7e7e, 0xff1f13, 0xc0120b, 0x5a1301, 0xffcc02, 0xedb113,
		0x9fce66, 0x0c9a39, 0xfe9872, 0x7f3f98, 0xf26522, 0x2bb673,
		0xd7df23, 0xe6b23a, 0x7ed3f7][label]
	);
});

xhr = new XMLHttpRequest();
xhr.open('GET', '/globe-coffee/data.json', true);
xhr.onreadystatechange = function(e) {
	if (xhr.readyState === 4) {
		if (xhr.status === 200) {
			var data = JSON.parse(xhr.responseText);
			window.data = data;
			globe.addData(data, {format: 'legend'});
			globe.createPoints();
			globe.animate();
		}
	}
};
xhr.send(null);