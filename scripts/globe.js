/**
* dat.globe Javascript WebGL Globe Toolkit
* http://dataarts.github.com/dat.globe
*
* Copyright 2011 Data Arts Team, Google Creative Lab
*
* Licensed under the Apache License, Version 2.0 (the 'License');
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*/

var DAT = DAT || {};

// hack: making target global
var target = {};

DAT.Globe = function(map, container, colorFn) {
	var Shaders = {
		'earth' : {
			uniforms: {
				'texture': { type: 't', value: 0, texture: null }
			},
			vertexShader: [
				'varying vec3 vNormal;',
				'varying vec2 vUv;',
				'void main() {',
					'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
					'vNormal = normalize( normalMatrix * normal );',
					'vUv = uv;',
				'}'
			].join('\n'),
			fragmentShader: [
				'uniform sampler2D texture;',
				'varying vec3 vNormal;',
				'varying vec2 vUv;',
				'void main() {',
					'vec3 diffuse = texture2D( texture, vUv ).xyz;',
					'float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );',
					'vec3 atmosphere = vec3( 1.0, 1.0, 1.0 ) * pow( intensity, 3.0 );',
					'gl_FragColor = vec4( diffuse + atmosphere, 1.0 );',
				'}'
			].join('\n')
		},
		'atmosphere' : {
			uniforms: {},
			vertexShader: [
				'varying vec3 vNormal;',
				'void main() {',
					'vNormal = normalize( normalMatrix * normal );',
					'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
				'}'
			].join('\n'),
			fragmentShader: [
				'varying vec3 vNormal;',
				'void main() {',
					'float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 12.0 );',
					'gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 ) * intensity;',
				'}'
			].join('\n')
		}
	};

	var camera, scene, sceneAtmosphere, renderer, w, h,
	    vector, mesh, mesh2, atmosphere, point, overRenderer,
	    start          = new Date(),
	    imgDir         = 'images/',
	    zoomSpeed      = 50,
	    curZoomSpeed   = 0,
	    mouse          = { x: 0, y: 0 },
	    mouseOnDown    = { x: 0, y: 0 },
	    rotation       = { x: 0, y: 0 },
	    distance       = 400,
	    distanceTarget = 100000, // TODO: this used to match distance, but then I cut distance down to 400. Change it too?
	    padding        = 40,
	    PI_HALF        = Math.PI / 2,
	    colorFn        = colorFn || function(x) {
					var c = new THREE.Color();
					c.setHSV( ( 0.6 - ( x * 0.5 ) ), 1.0, 1.0 );
					return c;
				};
	
	// hack: making target global
	target       = { x: 3.0 * PI_HALF, y: PI_HALF / 3.0 };
	targetOnDown = { x: 0, y: 0 };

	function init() {
		var shader, uniforms, material;
		
		w = container.offsetWidth  || window.innerWidth;
		h = container.offsetHeight || window.innerHeight;
		
		//
		// Make a new camera, scaled to the window
		//
		camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
		camera.position.z = distance;
		
		// Not entirely sure what this is for. Updated during render()
		vector = new THREE.Vector3();

		//
		// Make a scene
		//
		scene           = new THREE.Scene();
		sceneAtmosphere = new THREE.Scene();

		//
		// Setup the earth shape
		//
		geometry = new THREE.SphereGeometry(200, 60, 60);
		shader   = Shaders['earth'];
		uniforms = THREE.UniformsUtils.clone(shader.uniforms);
		
		uniforms['texture'].texture = THREE.ImageUtils.loadTexture(imgDir + map + '.jpg');
		
		material = new THREE.ShaderMaterial({
			uniforms:	uniforms,
			vertexShader:	shader.vertexShader,
			fragmentShader:	shader.fragmentShader
		});
		
		mesh = new THREE.Mesh( geometry, material );
		// mesh.rotation.x = 0.4;
		
		// The original globe code specified this, this prevents automatically redrawing it at render time. I believe you have to manually poke it to redraw it if this is false.
		// Not setting this as false for now to allow for automatic animation.
		// TODO: make this false and hook up manual redraws
		mesh.matrixAutoUpdate = false;
		mesh.updateMatrix();
		
		scene.add( mesh );
		
		//
		// Setup the atmosphere
		//
		shader   = Shaders['atmosphere'];
		uniforms = THREE.UniformsUtils.clone(shader.uniforms);
		
		material = new THREE.ShaderMaterial({
			uniforms:	uniforms,
			vertexShader:	shader.vertexShader,
			fragmentShader:	shader.fragmentShader
		});

		// mesh = new THREE.Mesh(geometry, material);
		// 
		// mesh.scale.x = mesh.scale.y = mesh.scale.z = 1.1;
		// mesh.flipSided        = true;
		// mesh.matrixAutoUpdate = false;
		// mesh.updateMatrix();
		// 
		// sceneAtmosphere.add(mesh);

		// 
		// Begin setting up how to draw bars on the globe
		//
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
		
		//
		// Setup an output for the scene, scaled to the window
		// Connect the output's HTML element to the document
		//
		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.autoClear = false;
		renderer.setClearColorHex(0x000000, 0.0);
		renderer.setSize(w, h);
		
		container.appendChild( renderer.domElement );
		
		container.addEventListener('mousedown', onMouseDown, false);
		container.addEventListener('mousewheel', onMouseWheel, false);

		container.addEventListener('mouseover', function() {
			overRenderer = true;
		}, false);

		container.addEventListener('mouseout', function() {
			overRenderer = false;
		}, false);
		
		document.addEventListener('keydown', onDocumentKeyDown, false);
		window.addEventListener('resize', onWindowResize, false);
	}
	
	function animate() {
		requestAnimationFrame(animate);
		render();
	}
	
	function render() {
		zoom(curZoomSpeed);
		
		var now = new Date();
		
		// Direct way to cause rotation, from cube demo
		// mesh.rotation.y += 0.002;
		
		// debug('rotation, x:', rotation.x, 'y:', rotation.y);
		// debug('distance:', distance);
		debug('camera position, x:', camera.position.x, 'y:', camera.position.y, 'z:', camera.position.z);
		debug('now:', now, 'time delta:', now - start);
		
		camera.position.x = distance * Math.cos(0.001 * (now - start));
		camera.position.z = distance * Math.sin(0.001 * (now - start));
		
		camera.rotation.y -= 0.017;
		
		vector.copy(camera.position);
		mesh.updateMatrix();
		
		// debug('rotation, x:', rotation.x, 'y:', rotation.y);
		// debug('distance:', distance);
		debug('camera position, x:', camera.position.x, 'y:', camera.position.y, 'z:', camera.position.z);
		
		if (now - start > 1000) {
			DEBUG = false;
		}
		// 8 - The renderer renders the scene and camera
		renderer.clear();
		renderer.render(scene, camera);
		
		// The atmosphere is totally obscuring the globe. Leaving this out for now.
		// TODO: work out why this suddenly obscures everything.
		// renderer.render(sceneAtmosphere, camera);
		
		// debugger;
	}
	
	function zoom(delta) {
		distanceTarget -= delta;
		distanceTarget = (distanceTarget > 1000) ? 1000 : distanceTarget;
		distanceTarget = (distanceTarget < 350)  ? 350  : distanceTarget;
	}

	function addData(data, opts) {
		var lat, lng, size, color, i, step, colorFnWrapper;

		opts.animated    = opts.animated || false;
		this.is_animated = opts.animated;
		opts.format      = opts.format || 'magnitude'; // other option is 'legend'
		
		if (opts.format === 'magnitude') {
			step = 3;
			colorFnWrapper = function(data, i) { return colorFn(data[i + 2]); }
		}
		else if (opts.format === 'legend') {
			step = 4;
			colorFnWrapper = function(data, i) { return colorFn(data[i + 3]); }
		}
		else {
			throw('error: format not supported: '+opts.format);
		}

		if (opts.animated) {
			if (this._baseGeometry === undefined) {
				this._baseGeometry = new THREE.Geometry();
				for (i = 0; i < data.length; i += step) {
					lat   = data[i];
					lng   = data[i + 1];
					// size  = data[i + 2];
					color = colorFnWrapper(data,i);
					size  = 0;
					addPoint(lat, lng, size, color, this._baseGeometry);
				}
			}
			if (this._morphTargetId === undefined) {
				this._morphTargetId = 0;
			}
			else {
				this._morphTargetId += 1;
			}
			opts.name = opts.name || 'morphTarget'+this._morphTargetId;
		}
		var subgeo = new THREE.Geometry();
		for (i = 0; i < data.length; i += step) {
			lat = data[i];
			lng = data[i + 1];
			color = colorFnWrapper(data,i);
			size = data[i + 2];
			size = size * 200;
			addPoint(lat, lng, size, color, subgeo);
		}
		if (opts.animated) {
			this._baseGeometry.morphTargets.push({'name': opts.name, vertices: subgeo.vertices});
		}
		else {
			this._baseGeometry = subgeo;
		}

	};

	function createPoints() {
		if (this._baseGeometry !== undefined) {
			if (this.is_animated === false) {
				this.points = new THREE.Mesh(this._baseGeometry, new THREE.MeshBasicMaterial({
					color: 0xffffff,
					vertexColors: THREE.FaceColors,
					morphTargets: false
				}));
			}
			else {
				if (this._baseGeometry.morphTargets.length < 8) {
					var padding = 8 - this._baseGeometry.morphTargets.length;

					for (var i = 0; i <= padding; i++) {
						this._baseGeometry.morphTargets.push({'name': 'morphPadding'+i, vertices: this._baseGeometry.vertices});
					}
				}
				this.points = new THREE.Mesh(this._baseGeometry, new THREE.MeshBasicMaterial({
					color: 0xffffff,
					vertexColors: THREE.FaceColors,
					morphTargets: true
				}));
			}
			scene.add(this.points);
		}
	}

	function addPoint(lat, lng, size, color, subgeo) {
		var phi   = (90 - lat) * Math.PI / 180;
		var theta = (180 - lng) * Math.PI / 180;

		point.position.x = 200 * Math.sin(phi) * Math.cos(theta);
		point.position.y = 200 * Math.cos(phi);
		point.position.z = 200 * Math.sin(phi) * Math.sin(theta);

		point.lookAt(mesh.position);

		point.scale.z = -size;
		point.updateMatrix();

		for (var i = 0; i < point.geometry.faces.length; i++) {
			point.geometry.faces[i].color = color;
		}

		THREE.GeometryUtils.merge(subgeo, point);
	}

	function onMouseDown(event) {
		event.preventDefault();

		container.addEventListener('mousemove', onMouseMove, false);
		container.addEventListener('mouseup', onMouseUp, false);
		container.addEventListener('mouseout', onMouseOut, false);

		mouseOnDown.x = -(event.clientX);
		mouseOnDown.y = event.clientY;

		targetOnDown.x = target.x;
		targetOnDown.y = target.y;

		container.style.cursor = 'move';
	}

	function onMouseMove(event) {
		mouse.x = - event.clientX;
		mouse.y = event.clientY;

		var zoomDamp = distance / 1000;

		target.x = targetOnDown.x + (mouse.x - mouseOnDown.x) * 0.005 * zoomDamp;
		target.y = targetOnDown.y + (mouse.y - mouseOnDown.y) * 0.005 * zoomDamp;

		target.y = target.y > PI_HALF ? PI_HALF : target.y;
		target.y = target.y < -PI_HALF ? -PI_HALF : target.y;
	}

	function onMouseUp(event) {
		container.removeEventListener('mousemove', onMouseMove, false);
		container.removeEventListener('mouseup', onMouseUp, false);
		container.removeEventListener('mouseout', onMouseOut, false);
		
		container.style.cursor = 'auto';
	}

	function onMouseOut(event) {
		container.removeEventListener('mousemove', onMouseMove, false);
		container.removeEventListener('mouseup', onMouseUp, false);
		container.removeEventListener('mouseout', onMouseOut, false);
	}

	function onMouseWheel(event) {
		event.preventDefault();
		if (overRenderer) {
			zoom(event.wheelDeltaY * 0.3);
		}
		return false;
	}

	function onDocumentKeyDown(event) {
		switch (event.keyCode) {
			case 38: // up
				zoom(100);
				event.preventDefault();
			break;
			case 40: // down
				zoom(-100);
				event.preventDefault();
			break;
		}
	}

	function onWindowResize(event) {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( container.innerWidth, container.innerHeight );
	}
	
	this.__defineGetter__('time', function() {
		return this._time || 0;
	});

	this.__defineSetter__('time', function(t) {
		var validMorphs = [];
		var morphDict = this.points.morphTargetDictionary;
		
		for (var k in morphDict) {
			if (k.indexOf('morphPadding') < 0) {
				validMorphs.push(morphDict[k]);
			}
		}
		validMorphs.sort();
		
		var l       = validMorphs.length - 1;
		var scaledt = t * l + 1;
		var index   = Math.floor(scaledt);
		
		for (i = 0; i < validMorphs.length; i++) {
			this.points.morphTargetInfluences[validMorphs[i]] = 0;
		}
		
		var lastIndex = index - 1;
		var leftover  = scaledt - index;
		
		if (lastIndex >= 0) {
			this.points.morphTargetInfluences[lastIndex] = 1 - leftover;
		}
		
		this.points.morphTargetInfluences[index] = leftover;
		this._time = t;
	});

	this.animate      = animate;
	this.addData      = addData;
	this.createPoints = createPoints;
	this.renderer     = renderer;
	this.scene        = scene;


	init();
	return this;

};

