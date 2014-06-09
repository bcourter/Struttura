
var ClothScene = function (container, material, mousemove) {
	this.container = container;
	this.geometry;
	this.material = material;

	this.renderer = new THREE.WebGLRenderer();
	this.width = container.offsetWidth;
    this.height = window.innerHeight;
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    if (mousemove !== undefined)
	    this.container.addEventListener( 'mousemove', mousemove, false );

    this.camera = new THREE.PerspectiveCamera(10, this.width / this.height, 1, 1000);

   	this.scene = new THREE.Scene();

   	this.vertexGeometry = new THREE.SphereGeometry(0.51, 16, 16);
    this.vertexMesh = new THREE.Mesh(this.vertexGeometry, new THREE.MeshBasicMaterial({ color:0x770000}));
    this.targetList = [];
};

// for the geometry callback
ClothScene.prototype.create = function (geometry) {
	this.geometry = geometry;
    var scene = this.scene;
    scene.add(THREE.SceneUtils.createMultiMaterialObject(geometry, this.material));
    this.targetList.push(new THREE.Mesh(geometry));

    if (isMirror) {
        var mirrorObj = THREE.SceneUtils.createMultiMaterialObject(geometry, this.material);
        mirrorObj.applyMatrix(new THREE.Matrix4().makeScale(-1, 1, 1));
        scene.add(mirrorObj);
    }

    var ambientLight = new THREE.AmbientLight(0x666666);
    scene.add(ambientLight);

    scene.fog = new THREE.Fog(0x333333, 1500, 2100);

    // var directionalLight = new THREE.DirectionalLight(0x8888aa);
    // directionalLight.position.set(1, 1, 1).normalize();
    // scene.add(directionalLight);

    // var directionalLight = new THREE.DirectionalLight(0x8888aa);
    // directionalLight.position.set(-1, 1, 1).normalize();
    // scene.add(directionalLight);

    scene.add(this.vertexMesh);
}

ClothScene.prototype.render = function() {
    if (this.geometry === undefined) 
        return;

    this.geometry.computeFaceNormals();
    this.geometry.computeVertexNormals();
    this.geometry.normalsNeedUpdate = true;
    this.geometry.verticesNeedUpdate = true;

    this.renderer.render(this.scene, this.camera);

}

ClothScene.prototype.onWindowResize = function() {
	this.width = this.container.offsetWidth;
    this.height = window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
}