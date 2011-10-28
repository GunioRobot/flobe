var camera, scene, renderer,
	geometry, material, mesh;

init();
animate();

function init() {
	//
	// Make a new camera, scaled to the window
	//
	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
	camera.position.z = 1000;
	
	//
	// Make a scene
	//
	scene = new THREE.Scene();

	//
	// Make a cube
	// Make a material for a mesh
	//
	geometry = new THREE.CubeGeometry( 200, 200, 200 );
	material = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true } );

	//
	// Mesh the cube and material together
	// Add the mesh to the scene
	//
	mesh = new THREE.Mesh( geometry, material );
	scene.add( mesh );

	//
	// Setup an output for the scene, scaled to the window
	//
	renderer = new THREE.CanvasRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );

	//
	// Connect the output's HTML element to the document
	//
	document.body.appendChild( renderer.domElement );
}

//
// Kicked off after init(), and then it calls itself via requestAnimationFrame
//
function animate() {
	requestAnimationFrame( animate );
	render();
}

//
// Kicked off by animate()
//
function render() {
	mesh.rotation.x += 0.01;
	mesh.rotation.y += 0.02;

	renderer.render( scene, camera );
}