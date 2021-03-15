import {initialize} from "./src/initialize.js";
import {Particle} from "./src/particle.js";
import {InstancedBufferGeometry} from "./node_modules/three/src/core/InstancedBufferGeometry.js";
import {Mesh} from "./node_modules/three/src/objects/Mesh.js";
import {CircleBufferGeometry} from "./node_modules/three/src/geometries/CircleGeometry.js";
import {ShaderMaterial} from "./node_modules/three/src/materials/ShaderMaterial.js";
import {Color} from "./node_modules/three/src/math/Color.js";
import {InstancedBufferAttribute} from "./node_modules/three/src/core/InstancedBufferAttribute.js";
import {Uniform} from "./node_modules/three/src/core/Uniform.js";
import {InstancedMesh} from "./node_modules/three/src/objects/InstancedMesh.js";

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
    intensity: 1
}
const mouseHandler = {
    x: null,
    y: null
}
const instanceCount = 500000;
const tickCount = 100;
let particles = 0;
let hue = 0;

const sceneObj = initialize(cameraLocation, rendererParameters, lightProperties, canvasContainer);
// console.log(sceneObj);

//creating base and instanced geometry
const circleRadius = 15;
let circleGeometry = new CircleBufferGeometry(circleRadius, 32);
let instancedGeometry = new InstancedBufferGeometry();

//copying attributes into instancedGeometry
Object.keys(circleGeometry.attributes).forEach(attributeName => {
    instancedGeometry.attributes[attributeName] = circleGeometry.attributes[attributeName]
})
instancedGeometry.index = circleGeometry.index;
instancedGeometry.maxInstancedCount = instanceCount;

// //setting colours
// let colours = [];
// for (let i = 0; i < 100; i++) {
//     //how we control the colours of the circle
//     const aColour = new Color(`hsl(${hue}, 100%, 50%)`);
//
//     colours.push(aColour.r) //R
//     colours.push(aColour.g) //G
//     colours.push(aColour.b) //B
// }
// instancedGeometry.setAttribute(
//     "colours",
//     new InstancedBufferAttribute(new Float32Array(colours), 3, true)
// );

//setting properties x, y, scale, speedX, speedY
// let particlePositions = [];
// let particleProperties = [];
// for (let i = 0; i < tickCount; i++) {
//     const x = mouseHandler.x;
//     const y = mouseHandler.y;
//     const scale = Math.random();
//     const speedX = Math.random() * (2 - -2) + -2;
//     const speedY = Math.random() * (2 - -2) + -2;
//
//     particlePositions.push(x, y);
//     particleProperties.push(scale, speedX, speedY);
// }
// instancedGeometry.setAttribute(
//     "particlePositions",
//     new InstancedBufferAttribute(new Float32Array(particlePositions), 2, true)
// );
//
// instancedGeometry.setAttribute(
//     "particleProperties",
//     new InstancedBufferAttribute(new Float32Array(particleProperties), 3, true)
// );

//defining shaders:
let fragmentShader = `
varying vec3 vColours;

void main(){
  vec3 color = vColours;
  gl_FragColor = vec4(color, 1.);
}
`;

let vertexShader = `
uniform float u_time;

attribute vec3 colours;
varying vec3 vColours;
attribute vec2 particlePositions;
attribute vec3 particleProperties;

vec3 getParticlePosition(float posX, float posY, float speedX, float speedY, float scale) {
    vec2 pos = vec2(0.);
    pos.x = posX + (u_time * speedX);
    pos.y = posY + (u_time * speedY);
    vec3 particlePos = vec3(pos.x, pos.y, 1.0);

    return particlePos;
}
float getScaleValue(float scale) {
    float scaleVal = scale - u_time * 0.02 < 0.0 ? 0.0 : scale - u_time * 0.02;
    return scaleVal;
}

  void main(){
    float posX = particlePositions.x;
    float posY = particlePositions.y;
    float scale = particleProperties.x;
    float scaleVal = getScaleValue(scale);
    float speedX = particleProperties.y;
    float speedY = particleProperties.z;
  
    vec3 scalePosition = position * scaleVal;
    vec3 transformed = scalePosition.xyz;
    
    vec3 particlePosition = getParticlePosition(posX, posY, speedX, speedY, scaleVal);
    transformed += particlePosition;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.);
    
    vColours = colours;
  }
`;

//defining material
let uniforms = {
    u_time: { type: "f", value: 1.0 }
}
let material = new ShaderMaterial({fragmentShader, vertexShader, uniforms});
let mesh = new Mesh(instancedGeometry, material);
sceneObj.scene.add(mesh);

// mouse click event
sceneObj.renderer.domElement.addEventListener('click', async function (event) {
    mouseHandler.x = event.x < sceneObj.camera.right ? event.x - sceneObj.camera.right : event.x + sceneObj.camera.left;
    mouseHandler.y = event.y < sceneObj.camera.top ? - event.y + sceneObj.camera.top : - event.y - sceneObj.camera.bottom;

    uniforms.u_time.value = 0;

    let particlePositions = [];
    let particleProperties = [];
    let colours = [];
    for (let i = 0; i < tickCount; i++) {
        //setting properties x, y, scale, speedX, speedY
        const x = mouseHandler.x;
        const y = mouseHandler.y;
        // const scale = Math.random();
        const scale = Math.random();
        const speedX = Math.random() * (5 - -5) + -5;
        const speedY = Math.random() * (5 - -5) + -5;

        //setting colours
        const aColour = new Color(`hsl(${hue}, 100%, 50%)`);
        colours.push(aColour.r) //R
        colours.push(aColour.g) //G
        colours.push(aColour.b) //B

        particlePositions.push(x, y);
        particleProperties.push(scale, speedX, speedY);
    }
    instancedGeometry.setAttribute(
        "particlePositions",
        new InstancedBufferAttribute(new Float32Array(particlePositions), 2, true)
    );

    instancedGeometry.setAttribute(
        "particleProperties",
        new InstancedBufferAttribute(new Float32Array(particleProperties), 3, true)
    );

    instancedGeometry.setAttribute(
        "colours",
        new InstancedBufferAttribute(new Float32Array(colours), 3, true)
    );
});

// mousemove event
// sceneObj.renderer.domElement.addEventListener('mousemove', async function (event) {
//     mouseHandler.x = event.x < sceneObj.camera.right ? event.x - sceneObj.camera.right : event.x + sceneObj.camera.left;
//     mouseHandler.y = event.y < sceneObj.camera.top ? - event.y + sceneObj.camera.top : - event.y - sceneObj.camera.bottom;
//
//     uniforms.u_time.value = 0;
//
//     //setting properties x, y
//     let particlePositions = [];
//     let particleProperties = [];
//     for (let i = 0; i < instanceCount; i++) {
//         const x = mouseHandler.x;
//         const y = mouseHandler.y;
//         const scale = Math.random();
//         const speedX = Math.random() * (5 - -5) + -5;
//         const speedY = Math.random() * (5 - -5) + -5;
//
//         particlePositions.push(x, y);
//         particleProperties.push(scale, speedX, speedY);
//     }
//     instancedGeometry.setAttribute(
//         "particlePositions",
//         new InstancedBufferAttribute(new Float32Array(particlePositions), 2, true)
//     );
//
//     instancedGeometry.setAttribute(
//         "particleProperties",
//         new InstancedBufferAttribute(new Float32Array(particleProperties), 3, true)
//     );
//
//     sceneObj.scene.add(mesh);
// });

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
    uniforms.u_time.value += 1.0;
    hue++;
    sceneObj.renderer.render(sceneObj.scene, sceneObj.camera);
}

animate();
