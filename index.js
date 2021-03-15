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
const sceneObj = initialize(cameraLocation, rendererParameters, lightProperties, canvasContainer);
// console.log(sceneObj);


const instanceCount = 1000;
let tickCount = 100;
let particles = 0;
let renderIndex = 0;
let hue = 0;


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
instancedGeometry.setDrawRange(0, tickCount);

let particlePositions = new Array(instanceCount*2);
let particleProperties =  new Array(instanceCount*3);
let colours = new Array(instanceCount*3);
const particlePositionsAttr = new InstancedBufferAttribute(new Float32Array(particlePositions), 2, true);
const particlePropertiesAttr =  new InstancedBufferAttribute(new Float32Array(particleProperties), 3, true);
const coloursAttr = new InstancedBufferAttribute(new Float32Array(colours), 3, true);

instancedGeometry.setAttribute("particlePositions", particlePositionsAttr);
instancedGeometry.setAttribute("particleProperties", particlePropertiesAttr);
instancedGeometry.setAttribute("colours", coloursAttr);

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
    const particlePositions = mesh.geometry.attributes.particlePositions.array;
    const particleProperties = mesh.geometry.attributes.particleProperties.array;
    const colours = mesh.geometry.attributes.colours.array;

    uniforms.u_time.value = 0;

    //TODO: Look into indexing reference issues
    particles = tickCount + tickCount >= instanceCount ? 0 : particles;
    const initialIndex = particles;
    let particlePositionsIndex = initialIndex * 2;
    let particlePropertiesIndex = initialIndex * 3;
    let coloursIndex = initialIndex * 3;
    tickCount = tickCount + tickCount >= instanceCount ? 100 : tickCount + tickCount;

    mouseHandler.x = event.x < sceneObj.camera.right ? event.x - sceneObj.camera.right : event.x + sceneObj.camera.left;
    mouseHandler.y = event.y < sceneObj.camera.top ? - event.y + sceneObj.camera.top : - event.y - sceneObj.camera.bottom;

    for (let i = renderIndex; i < instanceCount; i++) {
        particles += 1;
        if (particles == tickCount) break;

        // setting properties x, y, scale, speedX, speedY
        const x = mouseHandler.x;
        const y = mouseHandler.y;
        particlePositions[particlePositionsIndex++] = x;
        particlePositions[particlePositionsIndex++] = y;

        // const scale = Math.random();
        const scale = Math.random();
        const speedX = Math.random() * (5 - -5) + -5;
        const speedY = Math.random() * (5 - -5) + -5;
        particleProperties[particlePropertiesIndex++] = scale;
        particleProperties[particlePropertiesIndex++] = speedX;
        particleProperties[particlePropertiesIndex++] = speedY;

        //setting colours
        const aColour = new Color(`hsl(${hue}, 100%, 50%)`);
        colours[coloursIndex++] = aColour.r;
        colours[coloursIndex++] = aColour.g;
        colours[coloursIndex++] = aColour.b;
    }

    //TODO: And how to reference the correct offset and count
    instancedGeometry.setDrawRange(0, tickCount);
    console.log(initialIndex, particles, particlePositionsIndex, particlePropertiesIndex, coloursIndex);
    mesh.geometry.attributes.particlePositions.updateRange = {offset: initialIndex, count: particlePositionsIndex};
    mesh.geometry.attributes.particleProperties.updateRange = {offset: initialIndex, count: particlePropertiesIndex};
    mesh.geometry.attributes.colours.updateRange = {offset: initialIndex, count: coloursIndex};
    mesh.material.needsUpdate = true;
    mesh.geometry.computeBoundingBox();
    mesh.geometry.computeBoundingSphere();
    console.log(mesh.geometry);
});

// mousemove event
// sceneObj.renderer.domElement.addEventListener('mousemove', async function (event) {
//     const particlePositions = mesh.geometry.attributes.particlePositions.array;
//     const particleProperties = mesh.geometry.attributes.particleProperties.array;
//     const colours = mesh.geometry.attributes.colours.array;
//
//     uniforms.u_time.value = 0;
//     let particlePositionsIndex = 0;
//     let particlePropertiesIndex = 0;
//     let coloursIndex = 0;
//     particles = tickCount + tickCount < instanceCount ? particles : 0;
//     tickCount = tickCount + tickCount >= instanceCount ? 100 : tickCount + tickCount;
//
//     mouseHandler.x = event.x < sceneObj.camera.right ? event.x - sceneObj.camera.right : event.x + sceneObj.camera.left;
//     mouseHandler.y = event.y < sceneObj.camera.top ? - event.y + sceneObj.camera.top : - event.y - sceneObj.camera.bottom;
//
//     for (let i = renderIndex; i < instanceCount; i++) {
//         particles += 1;
//         if (particles == tickCount) break;
//
//         // setting properties x, y, scale, speedX, speedY
//         const x = mouseHandler.x;
//         const y = mouseHandler.y;
//         particlePositions[particlePositionsIndex++] = x;
//         particlePositions[particlePositionsIndex++] = y;
//
//         // const scale = Math.random();
//         const scale = Math.random();
//         const speedX = Math.random() * (5 - -5) + -5;
//         const speedY = Math.random() * (5 - -5) + -5;
//         particleProperties[particlePropertiesIndex++] = scale;
//         particleProperties[particlePropertiesIndex++] = speedX;
//         particleProperties[particlePropertiesIndex++] = speedY;
//
//         //setting colours
//         const aColour = new Color(`hsl(${hue}, 100%, 50%)`);
//         colours[coloursIndex++] = aColour.r;
//         colours[coloursIndex++] = aColour.g;
//         colours[coloursIndex++] = aColour.b;
//     }
//
//     instancedGeometry.setDrawRange(0, tickCount);
//     mesh.geometry.attributes.particlePositions.needsUpdate = true;
//     mesh.geometry.attributes.particleProperties.needsUpdate = true;
//     mesh.geometry.attributes.colours.needsUpdate = true;
//     mesh.material.needsUpdate = true;
//     mesh.geometry.computeBoundingBox();
//     mesh.geometry.computeBoundingSphere();
//     console.log(mesh.geometry);
// });

const preRender = () => {
    const particlePositions = mesh.geometry.attributes.particlePositions.array;
    const particleProperties = mesh.geometry.attributes.particleProperties.array;
    const colours = mesh.geometry.attributes.colours.array;

    for (let i = 0; i < instanceCount; i++) {
        particlePositions.push(0.0); //x
        particlePositions.push(0.0); //y

        particleProperties.push(0.0); //scale
        particleProperties.push(0.0); //speedX
        particleProperties.push(0.0); //speedY

        colours.push(0.0); //r
        colours.push(0.0); //g
        colours.push(0.0); //b
    }

    mesh.geometry.attributes.particlePositions.needsUpdate = true;
    mesh.geometry.attributes.particleProperties.needsUpdate = true;
    mesh.geometry.attributes.colours.needsUpdate = true;
}
const animate = () => {
    requestAnimationFrame(animate);
    uniforms.u_time.value += 1.0;
    hue++;
    sceneObj.renderer.render(sceneObj.scene, sceneObj.camera);
}
// preRender();
animate();
