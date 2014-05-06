var renderer, camera, settings, container3D, panels
var material, geometry;
var mesh, edgeMesh;
var objModel = [];
var objModelCount = 3;
var lastTime = 0, lastAnimation = 0, lastRotation = 0;

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
    camera.position.z = 70;

    var cookie = getCookie("view");
    if (cookie !== undefined && false) {
        var viewdata = cookie.split(',');

        camera.position.x = viewdata[0];
        camera.position.y = viewdata[1];
        camera.position.z = viewdata[2];

        camera.rotation.x = viewdata[3];
        camera.rotation.y = viewdata[4];
        camera.rotation.z = viewdata[5];
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

    var patternFile = 'resources/json3D/cylinder.js';

    loadpart( patternFile, function ( geometries, edges ) { loadGeometry(geometries, edges); } );

    settings = new Settings();
}

function loadGeometry(geometries, lines) {
    var g = geometries.shift();
    while (geometries.length > 0)
        THREE.GeometryUtils.merge(g, geometries.shift());

    g.mergeVertices();
    geometry = g;

    edgeMesh = lines;
    start2D(lines)
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

var frame = 0;
//var geom = THREE.CubeGeometry(2, 2, 2);
function render() {
    frame++;
    var time = new Date().getTime() / 1000;
    lastTime = time;

    if (geometry === undefined) {
        return;
    }

    var animGeometry = geometry;
 
    material = [
        new THREE.MeshPhongMaterial( { 
            color: 0x000000, 
            side: THREE.DoubleSide,
            shading: THREE.FlatShading, 
            specular: 0x999999,
            emissive: 0x000000,
            shininess: 10 
        } ),
        // new THREE.MeshLambertMaterial( { 
        //     color: 0x222222, 
        //     side: THREE.DoubleSide,
        //     shading: THREE.FlatShading, 
        //     transparent: true,  
        //     opacity: 0.5
        // } ),
        new THREE.MeshBasicMaterial( { 
            color: 0xEEEEEE, 
            shading: THREE.FlatShading, 
            wireframe: true,
            wireframeLinewidth: 2
        } )
    ];

    var scene = new THREE.Scene();
    scene.add(THREE.SceneUtils.createMultiMaterialObject(animGeometry, material));

    var ambientLight = new THREE.AmbientLight(0x666666);
    scene.add(ambientLight);

    scene.fog = new THREE.Fog(0x333333, 1500, 2100);

    var directionalLight = new THREE.DirectionalLight(0x8888aa);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    var directionalLight = new THREE.DirectionalLight(0x8888aa);
    directionalLight.position.set(-1, 1, 1).normalize();
    scene.add(directionalLight);

    renderer.render(scene, camera);

    if (frame % 100 == 0) {
        var viewdata = [6];

        viewdata[0] = camera.position.x;
        viewdata[1] = camera.position.y;
        viewdata[2] = camera.position.z;

        viewdata[3] = camera.rotation.x;
        viewdata[4] = camera.rotation.y;
        viewdata[5] = camera.rotation.z;

        setCookie("view", viewdata.join()); 
    }
}

function saveObj() {
    var op = THREE.saveToObj(basicMeshFromGeometry(geometry));

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