//Inspired by http://andrew-hoyer.com/experiments/cloth/, but written from scratch to be 3D and to use real physical units (MKS)
//And http://web.archive.org/web/20070610223835/http://www.teknikus.dk/tj/gdc2001.htm

var Physics = function () {
    this.points = []; 
    this.constraints = []; 

//    this.gravity = new THREE.Vector3(0, 0, -9.8;
    this.gravity = new THREE.Vector3(0, 0, 0);
    this.dampening = 0.9;
};

Physics.prototype.update = function (timeDelta) {
	var i = this.constraints.length;
	while (i--)	
		this.constraints[i].computeForces();

	i = this.points.length;
	while (i--)	{
		this.points[i].update(timeDelta);

		// if (i == 0){
  //   		this.position = new THREE.Vector3(0, 0, 1); 
  //   		this.oldPosition = this.position.clone();
		// }

	}
}

var Point = function (position, mass) {
    this.position = position || new THREE.Vector3(); 
    this.mass = mass || 1;
    this.oldPosition = position.clone();
    this.multiplier = new THREE.Vector3(1, 1, 1);
    this.sumForces = new THREE.Vector3(); 
};

Point.prototype.update = function (timeDelta) {
	var phys = new Physics();
	this.sumForces.add(phys.gravity.clone().multiplyScalar(this.mass));

	var temp = this.position.clone();
	this.position.multiplyScalar(1 + phys.dampening)
		.sub(this.oldPosition.multiplyScalar(phys.dampening))
		.add(this.sumForces.multiplyScalar(timeDelta * timeDelta / this.mass));
	this.oldPosition = temp;

	this.sumForces = new THREE.Vector3();
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