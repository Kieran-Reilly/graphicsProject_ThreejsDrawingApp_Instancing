import {Mesh} from "./../node_modules/three/src/objects/Mesh.js";
import {MeshBasicMaterial} from "./../node_modules/three/src/materials/MeshBasicMaterial.js";
import {PlaneGeometry} from "./../node_modules/three/src/geometries/PlaneGeometry.js";

export class Particle {
    constructor(sceneObj, x, y, colour, texture) {
        this.scene = sceneObj;
        this.x = x < this.scene.camera.right ? x - this.scene.camera.right : x + this.scene.camera.left;
        this.y = y < this.scene.camera.top ? -y + this.scene.camera.top : -y - this.scene.camera.bottom;
        this.size = Math.random() * 200 + 50;
        this.speedX = Math.random() * 3 - 1.5;
        this.speedY = Math.random() * 3 - 1.5;
        this.colour = 'hsl(' + colour + ', 100%, 50%)';
        this.texture = texture;
    }

    addParticle() {
        // const geometry = new PlaneGeometry(this.size/2, this.size/2);
        // const material = new MeshBasicMaterial({color: this.colour, alphaMap: this.texture, transparent: true, depthWrite:false, depthTest: false});
        // const particle = new Mesh(geometry, material);
        // particle.position.x = this.x;
        // particle.position.y = this.y;
        // this.scene.scene.add(particle);
        // this.createdParticle = particle;
        // return this;
    }

    async update() {
        // this.createdParticle.position.x += this.speedX;
        // this.createdParticle.position.y += this.speedY;
        // if (this.createdParticle.scale.x > 0.1) {
        //     this.createdParticle.scale.x -= 0.02;
        //     this.createdParticle.scale.y -= 0.02;
        // }
    }
}