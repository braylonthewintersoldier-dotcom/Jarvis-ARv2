// ==========================================
// JARVIS AR
// MAIN APPLICATION
// ==========================================

let scene;
let renderer;
let camera3D;

let objects = [];

let selectedObject = null;

let usingFrontCamera = true;

let physicsEnabled = false;

let handsDetected = 0;

let grabbing = false;

let grabbedObject = null;

let lastHandPosition = null;


// ==========================================
// THREE.JS SETUP
// ==========================================

scene = new THREE.Scene();

camera3D = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);

camera3D.position.z = 8;


renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById("scene"),
    alpha: true,
    antialias: true
});

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);


// ==========================================
// LIGHTING
// ==========================================

const ambientLight =
    new THREE.AmbientLight(
        0xffffff,
        1
    );

scene.add(ambientLight);


const pointLight =
    new THREE.PointLight(
        0x00ffff,
        5,
        50
    );

pointLight.position.set(
    0,
    3,
    5
);

scene.add(pointLight);


// ==========================================
// HOLOGRAM MATERIAL
// ==========================================

function hologramMaterial() {

    return new THREE.MeshStandardMaterial({

        color: 0x00ffff,

        emissive: 0x004c55,

        emissiveIntensity: 1.5,

        transparent: true,

        opacity: 0.85,

        metalness: 0.2,

        roughness: 0.25

    });

}


// ==========================================
// CREATE OBJECT
// ==========================================

function createObject(type) {

    let geometry;

    switch(type) {

        case "cube":

            geometry =
                new THREE.BoxGeometry(
                    1,
                    1,
                    1
                );

            break;


        case "sphere":

            geometry =
                new THREE.SphereGeometry(
                    0.6,
                    32,
                    32
                );

            break;


        case "pyramid":

            geometry =
                new THREE.ConeGeometry(
                    0.7,
                    1.2,
                    4
                );

            break;


        case "cylinder":

            geometry =
                new THREE.CylinderGeometry(
                    0.6,
                    0.6,
                    1.2,
                    32
                );

            break;


        case "torus":

            geometry =
                new THREE.TorusGeometry(
                    0.6,
                    0.2,
                    16,
                    32
                );

            break;

    }


    if(!geometry) return;


    const mesh =
        new THREE.Mesh(
            geometry,
            hologramMaterial()
        );


    mesh.position.set(
        0,
        0,
        0
    );


    mesh.userData.type = type;


    scene.add(mesh);

    objects.push(mesh);

    selectedObject = mesh;


    updateObjectCount();

}


// ==========================================
// DELETE
// ==========================================

function deleteSelected() {

    if(!selectedObject)
        return;


    scene.remove(
        selectedObject
    );


    objects =
        objects.filter(
            object =>
                object !== selectedObject
        );


    selectedObject = null;

    updateObjectCount();

}


// ==========================================
// DUPLICATE
// ==========================================

function duplicateSelected() {

    if(!selectedObject)
        return;


    const clone =
        selectedObject.clone();


    clone.position.x += 1;

    clone.material =
        selectedObject.material.clone();


    scene.add(clone);

    objects.push(clone);

    selectedObject = clone;

    updateObjectCount();

}


// ==========================================
// RESET
// ==========================================

function resetScene() {

    objects.forEach(
        object =>
            scene.remove(object)
    );


    objects = [];

    selectedObject = null;

    updateObjectCount();

}


// ==========================================
// PHYSICS
// ==========================================

function updatePhysics() {

    if(!physicsEnabled)
        return;


    objects.forEach(
        object => {

            if(
                object === grabbedObject
            )
                return;


            object.userData.velocity =
                object.userData.velocity ||
                new THREE.Vector3(
                    0,
                    0,
                    0
                );


            object.userData.velocity.y -=
                0.002;


            object.position.add(
                object.userData.velocity
            );


            if(object.position.y < -3) {

                object.position.y = -3;

                object.userData.velocity.y *= -0.5;

            }

        }
    );

}


// ==========================================
// CAMERA
// ==========================================

const video =
    document.getElementById(
        "camera"
    );


async function startCamera() {

    const stream =
        await navigator.mediaDevices
        .getUserMedia({

            video: {

                facingMode:
                    usingFrontCamera
                    ? "user"
                    : "environment",

                width: {
                    ideal: 1280
                },

                height: {
                    ideal: 720
                },

                frameRate: {
                    ideal: 30
                }

            },

            audio: false

        });


    video.srcObject =
        stream;

}


// ==========================================
// SWITCH CAMERA
// ==========================================

async function switchCamera() {

    usingFrontCamera =
        !usingFrontCamera;


    const stream =
        video.srcObject;


    if(stream) {

        stream.getTracks()
            .forEach(
                track =>
                    track.stop()
            );

    }


    await startCamera();

}


// ==========================================
// MEDIAPIPE
// ==========================================

const hands =
    new Hands({

        locateFile:
            file =>
                `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`

    });


hands.setOptions({

    maxNumHands: 2,

    modelComplexity: 1,

    minDetectionConfidence: 0.65,

    minTrackingConfidence: 0.65

});


hands.onResults(
    onHandsResults
);


// ==========================================
// MEDIAPIPE CAMERA
// ==========================================

const mpCamera =
    new Camera(
        video,
        {

            onFrame:
                async () => {

                    await hands.send({
                        image: video
                    });

                },

            width: 1280,

            height: 720

        }
    );


// ==========================================
// PINCH DETECTION
// ==========================================

function distance(a,b) {

    const dx =
        a.x - b.x;

    const dy =
        a.y - b.y;

    const dz =
        (a.z || 0) -
        (b.z || 0);

    return Math.sqrt(
        dx*dx +
        dy*dy +
        dz*dz
    );

}


function isPinching(hand) {

    if(!hand)
        return false;


    const thumb =
        hand[4];

    const index =
        hand[8];


    return (
        distance(
            thumb,
            index
        ) < 0.055
    );

}


// ==========================================
// HAND POSITION → WORLD
// ==========================================

function handToWorld(point) {

    return new THREE.Vector3(

        (point.x - 0.5) * 8,

        -(point.y - 0.5) * 5,

        0

    );

}


// ==========================================
// FIND OBJECT
// ==========================================

function findObject(position) {

    let closest = null;

    let closestDistance =
        Infinity;


    objects.forEach(
        object => {

            const distance =
                object.position.distanceTo(
                    position
                );


            if(
                distance < closestDistance
            ) {

                closestDistance =
                    distance;

                closest =
                    object;

            }

        }
    );


    if(
        closestDistance < 1.5
    )
        return closest;


    return null;

}


// ==========================================
// HAND RESULTS
// ==========================================

function onHandsResults(results) {

    handsDetected =
        results.multiHandLandmarks
        ? results.multiHandLandmarks.length
        : 0;


    updateHandCount();


    if(
        !results.multiHandLandmarks ||
        results.multiHandLandmarks.length === 0
    ) {

        grabbing = false;

        grabbedObject = null;

        return;

    }


    const hand =
        results.multiHandLandmarks[0];


    const index =
        hand[8];


    const worldPosition =
        handToWorld(index);


    const pinching =
        isPinching(hand);


    // ======================================
    // START GRAB
    // ======================================

    if(
        pinching &&
        !grabbing
    ) {

        const object =
            findObject(
                worldPosition
            );


        if(object) {

            grabbing = true;

            grabbedObject =
                object;

            selectedObject =
                object;

            updateMode(
                "GRABBING"
            );

        }

    }


    // ======================================
    // MOVE OBJECT
    // ======================================

    if(
        pinching &&
        grabbing &&
        grabbedObject
    ) {

        grabbedObject.position.lerp(
            worldPosition,
            0.35
        );

    }


    // ======================================
    // RELEASE
    // ======================================

    if(
        !pinching &&
        grabbing
    ) {

        grabbing = false;

        grabbedObject = null;

        updateMode(
            "IDLE"
        );

    }

}


// ==========================================
// TWO-HAND RESIZE
// ==========================================

function handleTwoHands(handsData) {

    if(
        handsData.length !== 2
    )
        return;


    if(!selectedObject)
        return;


    const hand1 =
        handsData[0];

    const hand2 =
        handsData[1];


    const point1 =
        hand1[8];

    const point2 =
        hand2[8];


    const d =
        distance(
            point1,
            point2
        );


    const scale =
        Math.max(
            0.2,
            Math.min(
                3,
                d * 5
            )
        );


    selectedObject.scale.set(
        scale,
        scale,
        scale
    );

}


// ==========================================
// BUTTONS
// ==========================================

document
    .getElementById(
        "cameraButton"
    )
    .onclick =
        switchCamera;


document
    .getElementById(
        "spawnCube"
    )
    .onclick =
        () =>
            createObject("cube");


document
    .getElementById(
        "spawnSphere"
    )
    .onclick =
        () =>
            createObject("sphere");


document
    .getElementById(
        "spawnPyramid"
    )
    .onclick =
        () =>
            createObject("pyramid");


document
    .getElementById(
        "spawnCylinder"
    )
    .onclick =
        () =>
            createObject("cylinder");


document
    .getElementById(
        "spawnTorus"
    )
    .onclick =
        () =>
            createObject("torus");


document
    .getElementById(
        "deleteButton"
    )
    .onclick =
        deleteSelected;


document
    .getElementById(
        "duplicateButton"
    )
    .onclick =
        duplicateSelected;


document
    .getElementById(
        "resetButton"
    )
    .onclick =
        resetScene;


document
    .getElementById(
        "physicsButton"
    )
    .onclick =
        () => {

            physicsEnabled =
                !physicsEnabled;


            updateMode(
                physicsEnabled
                    ? "PHYSICS"
                    : "IDLE"
            );

        };


// ==========================================
// JARVIS CHAT
// ==========================================

const chatInput =
    document.getElementById(
        "chat-input"
    );


const chatOutput =
    document.getElementById(
        "chat-output"
    );


function addChatMessage(
    text,
    user = false
) {

    const message =
        document.createElement(
            "div"
        );


    message.className =
        user
        ? "jarvis-message user-message"
        : "jarvis-message";


    message.textContent =
        text;


    chatOutput.appendChild(
        message
    );


    chatOutput.scrollTop =
        chatOutput.scrollHeight;

}


function jarvisResponse(
    question
) {

    const q =
        question.toLowerCase();


    if(
        q.includes("cube")
    ) {

        return `
JARVIS: A cube can be created using the CUBE button.
Pinch the cube to grab it.
Use two hands to resize it.
`;

    }


    if(
        q.includes("sphere")
    ) {

        return `
JARVIS: Press SPHERE to create a sphere.
You can grab and resize it.
`;

    }


    if(
        q.includes("physics")
    ) {

        return `
JARVIS: Press PHYSICS to enable the physics system.
Objects will fall and bounce.
`;

    }


    if(
        q.includes("hello") ||
        q.includes("hi")
    ) {

        return `
JARVIS: Hello. Systems are online.
`;

    }


    return `
JARVIS: I understand the request.

The full AI model-building system will be connected here next.
`;

}


function sendMessage() {

    const text =
        chatInput.value.trim();


    if(!text)
        return;


    addChatMessage(
        "YOU: " + text,
        true
    );


    chatInput.value = "";


    setTimeout(
        () => {

            addChatMessage(
                jarvisResponse(text)
            );

        },
        300
    );

}


document
    .getElementById(
        "send-button"
    )
    .onclick =
        sendMessage;


chatInput
    .addEventListener(
        "keydown",
        event => {

            if(
                event.key === "Enter"
            )
                sendMessage();

        }
    );


// ==========================================
// UI
// ==========================================

function updateObjectCount() {

    document
        .getElementById(
            "objectText"
        )
        .textContent =
            objects.length;

}


function updateHandCount() {

    document
        .getElementById(
            "handText"
        )
        .textContent =
            handsDetected;

}


function updateMode(mode) {

    document
        .getElementById(
            "modeText"
        )
        .textContent =
            mode;

}


// ==========================================
// RESIZE
// ==========================================

window.addEventListener(
    "resize",
    () => {

        camera3D.aspect =
            window.innerWidth /
            window.innerHeight;


        camera3D.updateProjectionMatrix();


        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

    }
);


// ==========================================
// ANIMATION
// ==========================================

function animate() {

    requestAnimationFrame(
        animate
    );


    objects.forEach(
        object => {

            object.rotation.x +=
                0.002;

            object.rotation.y +=
                0.003;

        }
    );


    updatePhysics();


    renderer.render(
        scene,
        camera3D
    );

}


animate();


// ==========================================
// START
// ==========================================

startCamera()
    .then(
        () => {

            mpCamera.start();

        }
    )
    .catch(
        error => {

            console.error(
                error
            );

            addChatMessage(
                "JARVIS: Camera permission is required."
            );

        }
    );
