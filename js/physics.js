//Inspired by http://andrew-hoyer.com/experiments/cloth/, but written from scratch to be 3D and to use real physical units (MKS)
//And http://web.archive.org/web/20070610223835/http://www.teknikus.dk/tj/gdc2001.htm

var Physics = function () {
    this.points = []; 
    this.constraints = []; 

//    this.gravity = new THREE.Vector3(0, 0, -9.8;
    this.gravity = new THREE.Vector3(0, 0, 0);
    this.dampening = 0.9;
    this.anisotropy = new THREE.Vector3(1.25, 0.25, 0.5);
    this.center = new THREE.Vector3();
    this.lastCenter = new THREE.Vector3();
    this.centerShift = new THREE.Vector3();
};

Physics.prototype.update = function (timeDelta) {
	var i = this.constraints.length;
	while (i--)	
		this.constraints[i].computeForces();

	var center = new THREE.Vector3();
	var i = this.points.length;
	while (i--)	
		center.add(this.points[i].position);

    var cg  = new THREE.Vector3();
	i = this.points.length;
	while (i--)	{
		var p = this.points[i];
//		p.sumForces.add(this.averageDrift);
		p.sumForces.sub(
			new THREE.Vector3()
				.add(p.position)
				.sub(center)
				.setLength(0.01)
				.multiply(this.anisotropy)
		);

	//	p.position.add(this.centerShift.multiply(p.multiplier));
		this.points[i].update(timeDelta);
		cg.add(p.position);
		
		
		// if (i == 0){
  //   		this.position = new THREE.Vector3(0, 0, 1); 
  //   		this.oldPosition = this.position.clone();
		// }

	}

	this.lastCenter = this.center;
	this.center = cg.divideScalar(this.points.length);
	this.centerShift = this.lastCenter.clone().sub(this.center).multiplyScalar(0.5);
}

var Point = function (position, mass) {
    this.position = position || new THREE.Vector3(); 
    this.mass = mass || 1;
    this.oldPosition = position.clone();
    this.multiplier = new THREE.Vector3(1, 1, 1);
    this.neighbors = [];
    this.stiffness = 0.01;
    this.sumForces = new THREE.Vector3(); 
};

Point.prototype.update = function (timeDelta) {
	var phys = new Physics();
	this.sumForces.add(phys.gravity.clone().multiplyScalar(this.mass));

	// var normal = new THREE.Vector3();
	// var i = this.neighbors.length;
	// while (i--)	
	// 	normal.add(this.neighbors[i].position);

	// normal.divideScalar(this.neighbors.length);
	// normal.sub(this.position).normalize();

	// var i = this.neighbors.length;
	// while (i--)	
	// 	this.neighbors[i].sumForces.add(
	// 		normal.multiplyScalar(
	// 			normal.dot(this.neighbors[i].position) * this.stiffness)
	// 	);

	var temp = this.position.clone();
	this.position.multiplyScalar(1 + phys.dampening)
		.sub(this.oldPosition.multiplyScalar(phys.dampening))
		.add(this.sumForces.multiplyScalar(timeDelta * timeDelta / this.mass).multiply(this.multiplier))
	;
	this.oldPosition = temp;

	temp = this.sumForces;
	this.sumForces = new THREE.Vector3();
	return temp;
};

var Spring = function (a, b, k) {
    this.a = a; 
    this.b = b; 
    this.k = k || 1;

    this.distance = a.position.distanceTo(b.position);
};

Spring.prototype.computeForces = function() {
	var separation = this.a.position.clone().sub(this.b.position);
	var dist = this.distance;
	var delta = dist - separation.length();

//	delta.multiplyScalar(dist * dist / (delta * delta + dist * dist) - 0.5);

	separation.setLength(this.k * delta / 2);
	this.a.sumForces.add(separation);
	this.b.sumForces.sub(separation);
}