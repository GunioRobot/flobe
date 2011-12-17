function init() {
	var shader, uniforms, material;

	w = container.offsetWidth || window.innerWidth;
	h = container.offsetHeight || window.innerHeight;

	// Guessing that PerspectiveCamera is the right choice. There are other types.
	camera = new THREE.PerspectiveCamera(30, w / h, 1, 10000);
	camera.position.z = distance / 100;

	// Not entirely sure what this is for. Updated during render()
	vector = new THREE.Vector3();

	scene = new THREE.Scene();
	sceneAtmosphere = new THREE.Scene();

	//
	// Setup the earth shape
	//
	var geometry = new THREE.SphereGeometry(200, 40, 30);

	shader = Shaders['earth'];
	uniforms = THREE.UniformsUtils.clone(shader.uniforms);
	uniforms['texture'].texture = THREE.ImageUtils.loadTexture(imgDir+map+'.jpg');

	material = new THREE.ShaderMaterial({
		uniforms:		uniforms,
		vertexShader:	shader.vertexShader,
		fragmentShader:	shader.fragmentShader
	});

	mesh = new THREE.Mesh(geometry, material);

	mesh.matrixAutoUpdate = false;
	scene.add(mesh);

	//
	// Setup the atmosphere
	//
	shader = Shaders['atmosphere'];
	uniforms = THREE.UniformsUtils.clone(shader.uniforms);

	material = new THREE.ShaderMaterial({
		uniforms:		uniforms,
		vertexShader:	shader.vertexShader,
		fragmentShader:	shader.fragmentShader
	});

	mesh = new THREE.Mesh(geometry, material);

	mesh.scale.x = mesh.scale.y = mesh.scale.z = 1.1;
	mesh.flipSided = true;
	mesh.matrixAutoUpdate = false;
	mesh.updateMatrix();
	sceneAtmosphere.add(mesh);

	//
	// Begin setting up how to draw bars on the globe

	geometry = new THREE.CubeGeometry(0.75, 0.75, 1, 1, 1, 1, null, false, {
		px: true,  nx: true,
		py: true,  ny: true,
		pz: false, nz: true
	});

	for (var i = 0; i < geometry.vertices.length; i++) {
		var vertex = geometry.vertices[i];
		vertex.position.z += 0.5;
	}

	point = new THREE.Mesh(geometry);

	// 7 - Output the scene through a renderer
	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.autoClear = false;
	renderer.setClearColorHex(0x000000, 0.0);
	renderer.setSize(w, h);

	container.appendChild(renderer.domElement);

	container.addEventListener('mousedown', onMouseDown, false);

	container.addEventListener('mousewheel', onMouseWheel, false);

	document.addEventListener('keydown', onDocumentKeyDown, false);

	window.addEventListener('resize', onWindowResize, false);

	container.addEventListener('mouseover', function() {
		overRenderer = true;
	}, false);

	container.addEventListener('mouseout', function() {
		overRenderer = false;
	}, false);
}