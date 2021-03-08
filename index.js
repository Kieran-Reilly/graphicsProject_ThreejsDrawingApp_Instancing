import {initialize} from "./src/initialize.js";
import {Particle} from "./src/particle.js";
import {InstancedBufferGeometry} from "./node_modules/three/src/core/InstancedBufferGeometry.js";
import {Mesh} from "./node_modules/three/src/objects/Mesh.js";
import {CircleBufferGeometry} from "./node_modules/three/src/geometries/CircleGeometry.js";
import {ShaderMaterial} from "./node_modules/three/src/materials/ShaderMaterial.js";
import {Color} from "./node_modules/three/src/math/Color.js";
import {InstancedBufferAttribute} from "./node_modules/three/src/core/InstancedBufferAttribute.js";

//init scene
const canvasContainer = document.querySelector("#canvas-container");
const rect = canvasContainer.getBoundingClientRect();
const cameraLocation = {z: 5,  viewWidth: rect.width, viewHeight: rect.height};
const rendererParameters = {antialias: true}; // see WebGLRendererParameters
const lightProperties = {
    x: 5,
    y: 5,
    z: 7.5,
    color: 0xffffff,
    integrity: -1.0
}
const mouseHandler = {
    x: null,
    y: null
}
const particles = [];
let hue = 0;

const sceneObj = initialize(cameraLocation, rendererParameters, lightProperties, canvasContainer);

let fragmentShader = `
    varying vec3 vColour;

    void main(){
        vec3 color = vColour;
        gl_FragColor = vec4(color, 1.);
    }
`;

let vertexShader = `
     //defining the attributes
    attribute vec4 properties;
    attribute vec3 aColour;
    varying vec3 vColour;

    //positioning logic
    vec3 getPosition(float x, float y) {
        vec3 pos = vec3(0.);
        pos.x += properties.speedX;
        pos.y += properties.speedY;
        
        return pos;
    }
    
    void main() {
        vec3 transformed = position.xyz;
        
        //extract values from attributes
        float radius = properties.size;
        float x = properties.posX;
        float y = properties.posY;
        
        vec3 particlePosition = getPosition(x, y);
        transformed += particlePosition;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.);
        vColour = aColour;
    }
`;


//creating the base geometry
let baseGeometry = new CircleBufferGeometry(50, 32);

let instancedGeometry = new InstancedBufferGeometry().copy(baseGeometry);
let instanceCount = 7000;
instancedGeometry.maxInstancedCount = instanceCount;

let material = new ShaderMaterial({fragmentShader, vertexShader});
let mesh = new Mesh(instancedGeometry, material);
sceneObj.scene.add(mesh);

//CREATING INSTANCED BUFFER ATTRIBUTES
//1. Create the values for each instance
let aColour = [];
let properties = []
// let colours = [new Color("#ff3030"), new Color("#121214")];

for (let i = 0; i < instanceCount; i++) {
    let posX = 0;
    let posY = 0;
    let size = Math.random() * 200 + 50;
    let speedX = Math.random() * 3 - 1.5;
    let speedY = Math.random() * 3 - 1.5;
    properties.push(posX, posY, size, speedX, speedY);

    hue++;
    aColour.push(new Color('hsl(' + hue + ', 100%, 50%)'));
}

//2. Transform the array to float32
let properties32 = new Float32Array(properties);
let aColourFloat32 = new Float32Array(aColour);

//3. Create the instanced Buffer Attribute
instancedGeometry.setAttribute("properties", new InstancedBufferAttribute(properties32, 5, false));
instancedGeometry.setAttribute("aColour", new InstancedBufferAttribute(aColourFloat32, 3, false));


// mouse click event
sceneObj.renderer.domElement.addEventListener('click', async function (event) {
    mouseHandler.x = event.x;
    mouseHandler.y = event.y;


    // for (let i = 0; i < 1; i++) {
    //     const particle = new Particle(sceneObj, mouseHandler.x, mouseHandler.y, hue++, circleTexture.renderTarget.texture);
    //     particles.push(particle.addParticle());
    // }
});

// mousemove event
sceneObj.renderer.domElement.addEventListener('mousemove', async function (event) {
    mouseHandler.x = event.x;
    mouseHandler.y = event.y;


    // for (let i = 0; i < 10; i++) {
    //     const particle = new Particle(sceneObj, mouseHandler.x, mouseHandler.y, hue, circleTexture.renderTarget.texture);
    //     particles.push(particle.addParticle());
    // }
});

async function particlesHandler() {


    // for (let i = 0; i < particles.length; i++) {
    //     particles[i].update();
    //
    //     if (particles[i].createdParticle.scale.x <= 0.2) {
    //         sceneObj.scene.remove(particles[i].createdParticle);
    //         particles.splice(i, 1);
    //         i--;
    //     }
    // }
}

const animate = () => {
    requestAnimationFrame(animate);
    // particlesHandler();
    // hue++;
    sceneObj.renderer.render(sceneObj.scene, sceneObj.camera);
}

animate();