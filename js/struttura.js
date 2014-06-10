var renderer, camera, settings, container3D, panels, scene
var material, geometry, physics, flatGeometry;
var mesh, lines, curves, isMirror;
var vertexGeometry, vertexMesh;
var trans2D, trans2Dinverse, canvas, ctx;
var objModel = [];
var objModelCount = 3;
var lastTime = 0, lastAnimation = 0, lastRotation = 0;
var intersectedObjects, targetList = [];

var pointmass = 0.001;  //kg
var springiness = 10;

var accuracy = 1E-3;
var accuracySquared = accuracy * accuracy;

var flatScene, flatMesh, flatCamera;

init();
animate();

function init() {
    renderer = new THREE.WebGLRenderer();
    renderer.autoClear = false;
    container3D = document.getElementById('3d');

    var width = container3D.offsetWidth;
    var height = window.innerHeight;
    renderer.setSize(width, height);
    container3D.appendChild(renderer.domElement);

    container3D.addEventListener( 'mousemove', mousemove3D, false );

    var aspectRatio = width / height;
    camera = new THREE.PerspectiveCamera(10, aspectRatio, 1, 1000);
    camera.position.y = 5;
    camera.position.z = 10;
    camera.right = camera.right + 100;;

    flatCamera = new THREE.OrthographicCamera(-aspectRatio, aspectRatio, 1, -1, 1, 10);
    flatCamera.position.z = 3;
    flatCamera.far = 10;

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

	controls.addEventListener( 'change', render3D );

    window.addEventListener('resize', onWindowResize, false);

   // var patternFile = 'resources/json3D/cylinder2.js';
    var patternFile = getGetValue("pattern");
    if (patternFile == null)
        patternFile = 'tshirt-44.js';

    patternFile = 'resources/json3D/' + patternFile;

    isMirror = getGetValue("mirror") == "0" ? false :  true;;
    if (patternFile == null)
        isMirror = true;

    loadpart(patternFile, function (geometries, lines, curves) { loadGeometry(geometries, lines, curves); });

}

function loadGeometry(geometries, lines, curves) {
    var g = geometries.shift();
    while (geometries.length > 0)
        THREE.GeometryUtils.merge(g, geometries.shift());

    this.lines = lines;
    this.curves = curves;

    g.mergeVertices();
    geometry = g;
    geometry.points = [];

    physics = new Physics();

    for (var k = 0; k < geometry.vertices.length; k++) {
        geometry.points[k] = new Point(geometry.vertices[k], pointmass);
        physics.points.push(geometry.points[k]);
    }   

    var curveBox = new THREE.Box3();
    for (var i = 0; i < curves.length; i++) {
        var vertexIndices = curves[i].vertexIndices = [];
        for (var j = 0; j < curves[i].vertices.length; j++) {
            curveBox.expandByPoint(curves[i].vertices[j]);
            for (var k = 0; k < geometry.vertices.length; k++) {
                if ((new THREE.Vector3()).subVectors(curves[i].vertices[j], geometry.vertices[k]).length() < accuracy) {
                    vertexIndices[j] = k;
                    break;
                }
            }

            if (k == geometry.vertices.length) 
                console.log('no point found');
        }

        var a = geometry.points[vertexIndices[0]];
        var b = geometry.points[vertexIndices[curves[i].vertices.length - 1]];

        if (a === undefined || b === undefined)
            continue;

        a.neighbors = b.neighbors;
        a.neighborDists = b.neighborDists;
    }

    geometry.computeBoundingBox();
    //create2D(geometry.boundingBox);
    flatGeometry = geometry.clone();

    createSprings(lines);
    createSprings(curves, 0, springiness * 10);

    var box = geometry.boundingBox.clone().union(curveBox);

    var xOffset = box.min.x;
    var xDist = box.size().x + xOffset;
    var thetaOffset = Math.PI * (xOffset / xDist + 1 / 2); 
    var r = xDist / Math.PI / 2;
    var span = 2 * Math.PI;
    var elliptical = 1.4;

    if (isMirror) {
        r *= 2;
        span /= 2; 
        thetaOffset -= Math.PI / 2;
    }

    for (var k = 0; k < geometry.vertices.length; k++) {
        var theta = geometry.vertices[k].x / xDist * span - thetaOffset;
        var z = -geometry.vertices[k].z;
        geometry.vertices[k].set(
            (r + z) * Math.sin(theta) * elliptical, 
            geometry.vertices[k].y, 
            (r + z) * Math.cos(theta) / elliptical);
        physics.points[k].position = geometry.vertices[k];
        physics.points[k].oldPosition = geometry.vertices[k].clone();

        if (isMirror && numbersAreEqual(geometry.vertices[k].x, 0))
            physics.points[k].multiplier = new THREE.Vector3(0, 1, 1);

        if (numbersAreEqual(geometry.vertices[k].y, 0))
            physics.points[k].multiplier = new THREE.Vector3(1, 0, 1);

    }

    createScene();
}

function createSprings(lines, distance, springK) {
    springK = springK || springiness;
    var springKFirst = springK * 1E-3;
    var springKSecond = springKFirst * 1E-1;

    for (var i = 0; i < lines.length; i++) {
        var vertexIndices = lines[i].vertexIndices = [];
        for (var j = 0; j < lines[i].vertices.length; j++) {
            for (var k = 0; k < geometry.vertices.length; k++) {
                if ((new THREE.Vector3()).subVectors(lines[i].vertices[j], geometry.vertices[k]).length() < accuracy) {
                    vertexIndices[j] = k;
                    break;
                }
            }

            if (k == geometry.vertices.length) {
                geometry.vertices.push(lines[i].vertices[j].clone());
                geometry.points.push(new Point(geometry.vertices[k], pointmass));
                geometry.points[k].multiplier = new THREE.Vector3(0, 1, 1);
                physics.points.push(geometry.points[k]);

                vertexIndices[j] = k;
               // console.log('no point found');
            }
        }

        var a = geometry.points[vertexIndices[0]];
        var b = geometry.points[vertexIndices[lines[i].vertices.length - 1]];
        a.neighbors.push(b);
        b.neighbors.push(a);

        var dist = a.position.distanceTo(b.position);
        a.neighborDists.push(dist);
        b.neighborDists.push(dist);
    }

    for (var i = 0; i < lines.length; i++) {
        var a = geometry.points[lines[i].vertexIndices[0]];
        var b = geometry.points[lines[i].vertexIndices[lines[i].vertexIndices.length - 1]];

        if (lines[i].colors[0] == 0xFF0000) {
            var noZ =  new THREE.Vector3(1, 0, 1);
            a.multiplier = noZ;
            b.multiplier = noZ;
            continue;
        }

        var spring = new Spring(a, b, springK);

        if (distance == 0)
            spring.max = 3E-4;

        // if (a.position.clone().sub(b.position).y > accuracy)
        //     spring.startTime = 3;
            spring.startTime = a.position.y;


        if (distance !== undefined) {
            spring.distance = distance;
        }

        physics.constraints.push(spring);
    }

    for (var i = 0; i < physics.points.length; i++) {
        var center = physics.points[i];
        for (var j = 0; j < center.neighbors.length; j++) {
            var first = center.neighbors[j];
            var firstDist = center.neighborDists[j];

            for (var k = 0; k < j; k++) {
                var other = center.neighbors[k];
                var otherDist = center.neighborDists[k];

                if (first.neighbors.indexOf(other) != -1) continue;

                var isSeam = false;
                for (var l = 0; l < physics.constraints.length; l++) {
                    var cons = physics.constraints[l];
                    if ((cons.a == first && cons.b == other) || (cons.a == other && cons.b == first)) {
                        isSeam = true;
                        break;
                    }
                }
                if (isSeam) continue;

            
                var spring = new Spring(
                    first,
                    other,
                    springKFirst);

                spring.distance = (firstDist + otherDist) * 3;
                spring.max = 1E-3;

                physics.constraints.push(spring);
            }
          
            // for (var k = 0; k < first.neighbors.length; k++) {
            //     var second = first.neighbors[k];
            //     if (second != center && -1 != first.neighborsSq.indexOf(second)) {
            //         first.neighborsSq.push(second);
            //         second.neighborsSq.push(first);
            //     }

            // }
        }
    }
}

function mousemove3D (e) {
    /*
    render2D();

    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;

    var vector = new THREE.Vector3( x, y, 1 );
    var projector = new THREE.Projector();
    projector.unprojectVector( vector, camera );
    var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

    var intersects = ray.intersectObjects( targetList );

    if (intersects.length == 0)
        return;
    */

    // TBD
};

function pointsAreEqual(a, b) {
    return a.distanceToSquared(b) < accuracySquared;
}

function numbersAreEqual(a, b) {
    return Math.abs(a, b) < accuracy ;
}


function create2D(box) {
    canvas = document.getElementById('c');
    ctx = canvas.getContext('2d');

    var spoonflowerwidth = 8100;
    var spoonflowerheight = 18100;
    var scale = 1/10;

    canvas.width = spoonflowerwidth * scale;
    canvas.height = spoonflowerheight * scale;

    var padding = 10;
    var skewZfactor = -2;
    var scaleX = (canvas.width - 2 * padding) / (box.size().x + 2 * box.min.x);
    var scaleY = (canvas.height - 2 * padding) / (box.size().y);
    var scale = Math.min(scaleX, scaleY);
    var transX = padding / scale;
    var transY = box.size().y + box.min.y + padding / scale + box.min.z * skewZfactor / 1.8;
    var rotation = new THREE.Matrix4().makeRotationX(Math.PI);
    var skewZ = new THREE.Matrix4();
    skewZ.elements[9] = skewZfactor;

    trans2D = new THREE.Matrix4()
        .multiply(skewZ)
        .multiplyScalar(scale)
        .multiply(new THREE.Matrix4().makeTranslation(transX, transY, 0))
        .multiply(rotation)
        ;

    trans2Dinverse = new THREE.Matrix4()
        .multiply(new THREE.Matrix4().getInverse(rotation))
        .multiplyScalar(1/scale)
        .multiply(new THREE.Matrix4().getInverse(skewZ));

    render2D();
};

function createScene() {

    var uniforms3D = {
                    flatPattern: { type: "f", value: 0.0 },
                };

    var uniforms2D = {
                    flatPattern: { type: "f", value: 1.0 },
                };

    var attributes2D = {
                    position3d: { type: 'v3', value: geometry.vertices }
    }

    var shaderMaterial3D = new THREE.ShaderMaterial( {
        uniforms: uniforms3D,
        vertexShader: document.getElementById( 'vertexShader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
        side: THREE.DoubleSide
    } );

    var shaderMaterial2D = new THREE.ShaderMaterial( {
        uniforms: uniforms2D,
        attributes: attributes2D,
        vertexShader: document.getElementById( 'vertexShader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
        side: THREE.DoubleSide
    } );

    var phongMaterial = new THREE.MeshPhongMaterial( { 
            color: 0x000000, 
            side: THREE.DoubleSide,
            shading: THREE.FlatShading, 
            specular: 0x999999,
            emissive: 0x000000,
            shininess: 10 
        } );

    var multiMaterial = [
        shaderMaterial3D,
        new THREE.MeshBasicMaterial( { 
            color: 0xEEEEEE,
            shading: THREE.FlatShading, 
            wireframe: true,
            wireframeLinewidth: 2
        } )
    ];

    scene = new THREE.Scene();
    mesh = THREE.SceneUtils.createMultiMaterialObject(geometry, multiMaterial);
   
    scene.add(mesh);
    if (isMirror) {
        var mirrorObj = mesh.clone();
        mirrorObj.applyMatrix(new THREE.Matrix4().makeScale(-1, 1, 1));
        scene.add(mirrorObj);
    }

    var ambientLight = new THREE.AmbientLight(0x666666);
    scene.add(ambientLight);

    scene.fog = new THREE.Fog(0x333333, 1500, 2100);

    var directionalLight = new THREE.DirectionalLight(0x8888aa);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    var directionalLight = new THREE.DirectionalLight(0x8888aa);
    directionalLight.position.set(-1, 1, 1).normalize();
    scene.add(directionalLight);

    vertexGeometry = new THREE.SphereGeometry(0.01, 16, 16);
    vertexMesh = new THREE.Mesh(vertexGeometry, new THREE.MeshBasicMaterial({ color:0x770000}));
    scene.add(vertexMesh);
    
    flatScene = new THREE.Scene();
    flatScene.add(directionalLight);

    flatMesh = new THREE.Mesh(flatGeometry, shaderMaterial2D);
    flatMesh.position.x = 0.75;
    flatScene.add(flatMesh);
    flatCamera.lookAt(flatScene.position);
}

function mousemove2D (e) {
    render2D();

    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;

    var canvasScale = canvas.width / rect.width;
    x *= canvasScale;
    y *= canvasScale;  // intionally same aspect ratio

    var mouseVector = new THREE.Vector3(x, y, 0);
//    var flatVector = mouseVector.applyMatrix4(trans2Dinverse);
//    flatVector.applyMatrix4(new THREE.Matrix4().makeTranslation(transX, transY, 0))

    var closest;
    var closestDistance = Infinity;
    for (var i = 0; i < flatGeometry.vertices.length; i++) {
        var dist = flatGeometry.vertices[i].clone().applyMatrix4(trans2D).setZ(0).distanceTo(mouseVector);
        if (dist < closestDistance) {
            closest = i;
            closestDistance = dist;
        }
    }

    var p = flatGeometry.vertices[closest].clone().applyMatrix4(trans2D);
    ctx.fillStyle = '#700';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 8, 0, 2 * Math.PI);
    ctx.fill();

 //   writeMessage (x + " " + y + " " + physics.points.length + " " + physics.constraints.length);

    e.preventDefault();

    function writeMessage(message) {
        ctx.clearRect(0, 0, 100, 40);
        ctx.font = '18pt Calibri';
        ctx.fillStyle = 'gray';
        ctx.fillText(message, 10, 25);
    }

    if (vertexMesh === undefined)
        return;

    vertexMesh.position = geometry.vertices[closest];
};

function onWindowResize() {
    var width = container3D.offsetWidth;
    var height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    flatCamera.aspect = width / height;
    flatCamera.updateProjectionMatrix();

    renderer.setSize(width, height);
}


function animate() {
    requestAnimationFrame(animate, renderer.domElement);

    render3D();
  //  render2D();
    controls.update();
    //stats.update();
}

var frame = 0;
//var geom = THREE.CubeGeometry(2, 2, 2);
function render3D() {
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

    flatMesh.material.attributes.position3d.value = geometry.vertices;
    flatMesh.material.attributes.position3d.needsUpdate = true;

    renderer.clear();
    renderer.render(scene, camera);
    renderer.clearDepth();
    renderer.render(flatScene, flatCamera);

    if (frame % 100 == 0) {
        var viewdata = [16];

        for (var i = 0; i < 16; i++)
            viewdata[i] = camera.projectionMatrix[i];

        setCookie("view", viewdata.join()); 
    }

    physics.update(0.006);

  //  physics.update(time - lastTime);
    lastTime = time;
}

function render2D() {
    if (ctx === undefined)
        return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#aaa';

    ctx.beginPath();
    for (var i = 0; i < lines.length; i++) {
        var p = lines[i].vertices[0].clone().applyMatrix4(trans2D);

        ctx.moveTo(p.x , p.y);
        for (var j = 1; j < lines[i].vertices.length; j++) {
            p = lines[i].vertices[j].clone().applyMatrix4(trans2D);
            ctx.lineTo(p.x , p.y);
        }
    }
    ctx.stroke();

    ctx.strokeStyle = '#00b';

    ctx.beginPath();
    for (var i = 0; i < curves.length; i++) {
        var p = curves[i].vertices[0].clone().applyMatrix4(trans2D);

        ctx.moveTo(p.x , p.y);
        for (var j = 1; j < curves[i].vertices.length; j++) {
            p = curves[i].vertices[j].clone().applyMatrix4(trans2D);
            ctx.lineTo(p.x , p.y);
        }
    }
    ctx.stroke();
}


function saveObj() {
    var op = THREE.saveToObj(new THREE.Mesh(geometry, new THREE.MeshLambertMaterial()));

    var newWindow = window.open("");
    newWindow.document.write(op);
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

function getGetValue(key){
    var location = window.location.search;
    if (location.length < 2)
        return null;

    var res = location.match(new RegExp("[?&]" + key + "=([^&/]*)", "i"));
    if (res == null)
        return null;

    return res[1];
}