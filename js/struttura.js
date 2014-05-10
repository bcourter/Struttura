var renderer, camera, settings, container3D, panels, scene
var material, geometry, physics;
var mesh, geometryEdges = [], geometryCurves = [];
var objModel = [];
var objModelCount = 3;
var lastTime = 0, lastAnimation = 0, lastRotation = 0;

var pointmass = 0.001;  //kg
var springiness = 10;

init();
animate();

function init() {
    renderer = new THREE.WebGLRenderer();
    container3D = document.getElementById('3d');
    var width = container3D.offsetWidth;
    var height = window.innerHeight;
    renderer.setSize(width, height);
    container3D.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(5, width / height, 1, 1000);
    camera.position.y = 5;
    camera.position.z = 30;

    var cookie = getCookie("view");
    if (cookie !== undefined   ) {
        var viewdata = cookie.split(',');

        for (var i = 0; i < 16; i++)
            camera.projectionMatrix[i] = viewdata[i];


    }

	controls = new THREE.OrbitControls(camera, container3D);

	controls.rotateSpeed = 2.0;
	controls.zoomSpeed = 2.0;
	controls.panSpeed = 0.2;

	controls.noZoom = false;
	controls.noPan = false;

	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;

	controls.keys = [ 65, 83, 68 ];

	controls.addEventListener( 'change', render );

    window.addEventListener('resize', onWindowResize, false);

    var Settings = function () {
        document.getElementById("saveObj").onclick = saveObj;
    };

   // var patternFile = 'resources/json3D/cylinder2.js';
    var patternFile = 'resources/json3D/dress10-28.js';

    loadpart( patternFile, function ( geometries, lines, curves ) { loadGeometry(geometries, lines, curves); } );
           



    settings = new Settings();
}

function loadGeometry(geometries, lines, curves) {
    var g = geometries.shift();
    while (geometries.length > 0)
        THREE.GeometryUtils.merge(g, geometries.shift());

    g.mergeVertices();
    geometry = g;
    geometry.points = [];

    physics = new Physics();


    for (var k = 0; k < geometry.vertices.length; k++) {
        geometry.points[k] = new Point(geometry.vertices[k], pointmass);
        physics.points.push(geometry.points[k]);
    }

    createSprings(lines);
    createSprings(curves, 0, springiness * 2);

    create2D(lines);

    geometry.computeBoundingBox();
    var xOffset = geometry.boundingBox.min.x;
    var xDist = geometry.boundingBox.size().x + xOffset;
    var thetaOffset = Math.PI * (xOffset / xDist + 1 / 2); 
    var r = xDist / Math.PI / 2;
    var elliptical = 1.2;
    for (var k = 0; k < geometry.vertices.length; k++) {
        var theta = geometry.vertices[k].x / xDist * 2 * Math.PI - thetaOffset;
        geometry.vertices[k].set(r * Math.sin(theta) * elliptical, geometry.vertices[k].y, r * Math.cos(theta) / elliptical);
        physics.points[k].position = geometry.vertices[k];
        physics.points[k].oldPosition = geometry.vertices[k].clone();
    }

    createScene();
}

function create2D(lines) {
    canvas = document.getElementById('c');
    ctx = canvas.getContext('2d');

    var spoonflowerwidth = 8100;
    var spoonflowerheight = 18100;
    var scale = 1/10;

    canvas.width = spoonflowerwidth * scale;
    canvas.height = spoonflowerheight * scale;

    ctx.strokeStyle = '#888';

    var drawScale = 1;
    for (var i = 0; i < lines.length; i++) {
        var p = lines[i].vertices[0].clone().multiplyScalar(drawScale);

        ctx.moveTo(p.x , p.y);
        for (var j = 1; j < lines[i].vertices.length; j++) {
            p = lines[i].vertices[j].clone().multiplyScalar(drawScale);
            ctx.lineTo(p.x , p.y);
        }

    }
};

function createScene() {
    material = [
        new THREE.MeshPhongMaterial( { 
            color: 0x000000, 
            side: THREE.DoubleSide,
            shading: THREE.FlatShading, 
            specular: 0x999999,
            emissive: 0x000000,
            shininess: 10 
        } ),
        new THREE.MeshBasicMaterial( { 
            color: 0xEEEEEE, 
            shading: THREE.FlatShading, 
            wireframe: true,
            wireframeLinewidth: 2
        } )
    ];

    scene = new THREE.Scene();
    scene.add(THREE.SceneUtils.createMultiMaterialObject(geometry, material));

    var ambientLight = new THREE.AmbientLight(0x666666);
    scene.add(ambientLight);

    scene.fog = new THREE.Fog(0x333333, 1500, 2100);

    var directionalLight = new THREE.DirectionalLight(0x8888aa);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    var directionalLight = new THREE.DirectionalLight(0x8888aa);
    directionalLight.position.set(-1, 1, 1).normalize();
    scene.add(directionalLight);
}

function createSprings(lines, distance, springK) {
    springK = springK || springiness;

    for (var i = 0; i < lines.length; i++) {
        lines[i].vertexIndices = [];
        for (var j = 0; j < lines[i].vertices.length; j++) {
            for (var k = 0; k < geometry.vertices.length; k++) {
                if ((new THREE.Vector3()).subVectors(lines[i].vertices[j], geometry.vertices[k]).length() < 1E-4) {
                    lines[i].vertexIndices[j] = k;
                    break;
                }
            }

            if (k == geometry.vertices.length)
                console.log('no point found');
        }
    }

    for (var i = 0; i < lines.length; i++) {
        var spring = new Spring(
            geometry.points[lines[i].vertexIndices[0]],
            geometry.points[lines[i].vertexIndices[lines[i].vertexIndices.length - 1]],
            springK);

        if (distance !== undefined) {
            spring.distance = distance;
        }

        physics.constraints.push(spring);
    }

}

function onWindowResize() {
    var width = container3D.offsetWidth;
    var height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
}

function animate() {
    requestAnimationFrame(animate, renderer.domElement);

    render();
    controls.update();
    //stats.update();
}

var animGeometry
var frame = 0;
var maxPhysics = 100;
//var geom = THREE.CubeGeometry(2, 2, 2);
function render() {
    frame++;
    var time = new Date().getTime() / 1000;

    if (geometry === undefined) {
        animGeometry = geometry;
        return;
    }

    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    geometry.normalsNeedUpdate = true;
    geometry.verticesNeedUpdate = true;

    renderer.render(scene, camera);

    if (frame % 100 == 0) {
        var viewdata = [16];

        for (var i = 0; i < 16; i++)
            viewdata[i] = camera.projectionMatrix[i];

        setCookie("view", viewdata.join()); 
    }

//    if (frame < maxPhysics)
        physics.update(0.001);
  //  physics.update(time - lastTime);
    lastTime = time;
}

function saveObj() {
    var op = THREE.saveToObj(new THREE.Mesh(geometry, new THREE.MeshLambertMaterial()));

    var newWindow = window.open("");
    newWindow.document.write(op);

    //console.log(op);
}

THREE.saveToObj = function (object3d) {
    var s = '';
	var offset = 1;

    object3d.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
            var mesh = child;

			var geometry = mesh.geometry;
			mesh.updateMatrixWorld();

			for (i = 0; i < geometry.vertices.length; i++) {
				var vector = new THREE.Vector3(geometry.vertices[i].x, geometry.vertices[i].y, geometry.vertices[i].z);
				vector.applyMatrix4(mesh.matrixWorld);

				s += 'v ' + (vector.x) + ' ' +
				vector.y + ' ' +
				vector.z + '<br />';
			}

			for (i = 0; i < geometry.faces.length; i++) {
				s += 'f ' +
				    (geometry.faces[i].a + offset) + ' ' +
				    (geometry.faces[i].b + offset) + ' ' +
				    (geometry.faces[i].c + offset)
				;

				if (geometry.faces[i].d !== undefined) {
				    s += ' ' + (geometry.faces[i].d + offset);
				}
				s += '<br />';
			}

			offset += geometry.vertices.length;
		}
	});

    return s;
}


function mergeAllVertices(object3D) {
    var offset = 0;
    var geometry = new THREE.Geometry();
    object3D.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
            if (geometry.vertices.length == 0) {
                geometry = child.geometry.clone();
                return;
            }

            THREE.GeometryUtils.merge(geometry, child.geometry);
        }
    });

    geometry.mergeVertices();
    return geometry;
}


    // from http://stackoverflow.com/questions/4825683/how-do-i-create-and-read-a-value-from-cookie
function setCookie(c_name,value,exdays) {
    var exdate=new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var c_value=escape(value) + 
    ((exdays==null) ? "" : ("; expires="+exdate.toUTCString()));
    document.cookie=c_name + "=" + c_value;
}

function getCookie(c_name) {
    var i,x,y,ARRcookies=document.cookie.split(";");
    for (i=0;i<ARRcookies.length;i++) {
        x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
        y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
        x=x.replace(/^\s+|\s+$/g,"");
        if (x==c_name) {
            return unescape(y);
        }
    }
}