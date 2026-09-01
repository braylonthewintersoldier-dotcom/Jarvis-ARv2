console.log("JARVIS: Scene starting");

let scene;
let threeCamera;
let renderer;

let objects = [];
let selectedObject = null;

let grabbedObject = null;
let grabOffset = new THREE.Vector3();

let physicsEnabled = false;

const WORLD_WIDTH = 8;
const WORLD_HEIGHT = 4.5;

/* =========================
   THREE.JS SETUP
   ========================= */

function initScene() {

    scene = new THREE.Scene();

    threeCamera = new THREE.PerspectiveCamera(
        55,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    threeCamera.position.z = 8;

    renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true
    });

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 2)
    );

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.domElement.id = "scene";

    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.pointerEvents = "none";
    renderer.domElement.style.zIndex = "1";

    const oldCanvas =
        document.getElementById("scene");

    if (oldCanvas) {
        oldCanvas.replaceWith(
            renderer.domElement
        );
    } else {
        document.body.appendChild(
            renderer.domElement
        );
    }

    /* LIGHT */

    const ambientLight =
        new THREE.AmbientLight(
            0xffffff,
            1.2
        );

    scene.add(ambientLight);

    const pointLight =
        new THREE.PointLight(
            0x00ffff,
            3,
            30
        );

    pointLight.position.set(
        0,
        2,
        5
    );

    scene.add(pointLight);

    window.addEventListener(
        "resize",
        resizeScene
    );

    animate();

    console.log(
        "JARVIS: Scene ready"
    );
}

/* =========================
   MATERIAL
   ========================= */

function hologramMaterial() {

    return new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 1.5,
        transparent: true,
        opacity: 0.72
    });
}

/* =========================
   ADD OBJECT
   ========================= */

function addObject(
    type = "cube"
) {

    let geometry;

    switch (
        type.toLowerCase()
    ) {

        case "sphere":

            geometry =
                new THREE.SphereGeometry(
                    0.65,
                    32,
                    32
                );

            break;

        case "cylinder":

            geometry =
                new THREE.CylinderGeometry(
                    0.55,
                    0.55,
                    1.2,
                    32
                );

            break;

        case "pyramid":

            geometry =
                new THREE.ConeGeometry(
                    0.7,
                    1.3,
                    4
                );

            break;

        case "torus":

            geometry =
                new THREE.TorusGeometry(
                    0.6,
                    0.18,
                    16,
                    32
                );

            break;

        case "cube":
        default:

            geometry =
                new THREE.BoxGeometry(
                    1.1,
                    1.1,
                    1.1
                );

            break;
    }

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

    mesh.userData.type =
        type;

    mesh.userData.velocity =
        new THREE.Vector3();

    mesh.userData.grabbed =
        false;

    scene.add(mesh);

    objects.push(mesh);

    selectedObject =
        mesh;

    console.log(
        "JARVIS: Added",
        type
    );

    return mesh;
}

/* =========================
   DELETE
   ========================= */

function deleteSelected() {

    if (!selectedObject) {
        return;
    }

    scene.remove(
        selectedObject
    );

    if (
        selectedObject.geometry
    ) {
        selectedObject.geometry.dispose();
    }

    if (
        selectedObject.material
    ) {
        selectedObject.material.dispose();
    }

    objects =
        objects.filter(
            object =>
                object !==
                selectedObject
        );

    selectedObject =
        null;

    grabbedObject =
        null;
}

/* =========================
   DUPLICATE
   ========================= */

function duplicateSelected() {

    if (!selectedObject) {
        return;
    }

    const clone =
        selectedObject.clone();

    clone.position.x += 1;

    clone.position.y += 0.5;

    clone.userData = {
        type:
            selectedObject.userData.type,

        velocity:
            new THREE.Vector3(),

        grabbed: false
    };

    scene.add(clone);

    objects.push(clone);

    selectedObject =
        clone;
}

/* =========================
   RESET
   ========================= */

function resetScene() {

    for (
        const object of objects
    ) {

        scene.remove(object);

        if (object.geometry) {
            object.geometry.dispose();
        }

        if (object.material) {
            object.material.dispose();
        }
    }

    objects = [];

    selectedObject =
        null;

    grabbedObject =
        null;
}

/* =========================
   PHYSICS
   ========================= */

function togglePhysics() {

    physicsEnabled =
        !physicsEnabled;

    return physicsEnabled;
}

/* =========================
   HAND → WORLD
   ========================= */

function handPositionToWorld(
    point
) {

    if (!point) {
        return null;
    }

    /*
       IMPORTANT:

       Camera is mirrored.

       Reverse MediaPipe X so
       physical hand movement and
       3D movement match.
    */

    const mirroredX =
        1 - point.x;

    const x =
        (
            mirroredX -
            0.5
        ) * WORLD_WIDTH;

    const y =
        -(
            point.y -
            0.5
        ) * WORLD_HEIGHT;

    /*
       Keep the object on a stable
       hologram plane.
    */

    const z = 0;

    return new THREE.Vector3(
        x,
        y,
        z
    );
}

/* =========================
   PINCH
   ========================= */

function isPinching(
    landmarks
) {

    if (
        !landmarks ||
        landmarks.length < 21
    ) {
        return false;
    }

    const thumb =
        landmarks[4];

    const index =
        landmarks[8];

    const dx =
        thumb.x -
        index.x;

    const dy =
        thumb.y -
        index.y;

    const dz =
        thumb.z -
        index.z;

    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy +
            dz * dz
        );

    return distance < 0.055;
}

/* =========================
   FIND OBJECT
   ========================= */

function findObjectNearHand(
    worldPosition
) {

    if (!worldPosition) {
        return null;
    }

    let closest = null;

    let closestDistance =
        Infinity;

    for (
        const object of objects
    ) {

        const distance =
            object.position.distanceTo(
                worldPosition
            );

        if (
            distance < 1.3 &&
            distance < closestDistance
        ) {

            closest =
                object;

            closestDistance =
                distance;
        }
    }

    return closest;
}

/* =========================
   HAND INTERACTION
   ========================= */

function updateHandInteraction() {

    if (
        typeof getHandLandmarks !==
        "function"
    ) {
        return;
    }

    const hands =
        getHandLandmarks();

    if (
        !hands ||
        hands.length === 0
    ) {

        if (grabbedObject) {
            releaseObject();
        }

        return;
    }

    const landmarks =
        hands[0];

    const indexTip =
        landmarks[8];

    const worldPosition =
        handPositionToWorld(
            indexTip
        );

    if (!worldPosition) {
        return;
    }

    const pinching =
        isPinching(
            landmarks
        );

    /* =====================
       GRAB
       ===================== */

    if (
        pinching &&
        !grabbedObject
    ) {

        const target =
            findObjectNearHand(
                worldPosition
            );

        if (target) {

            grabbedObject =
                target;

            selectedObject =
                target;

            target.userData.grabbed =
                true;

            /*
               Keep the exact point where
               the finger grabbed the object.
            */

            grabOffset
                .copy(
                    target.position
                )
                .sub(
                    worldPosition
                );
        }
    }

    /* =====================
       DIRECT FOLLOW
       ===================== */

    if (
        pinching &&
        grabbedObject
    ) {

        /*
           NO smoothing.

           The object immediately
           follows the fingertip.
        */

        grabbedObject.position.x =
            worldPosition.x +
            grabOffset.x;

        grabbedObject.position.y =
            worldPosition.y +
            grabOffset.y;

        grabbedObject.position.z =
            worldPosition.z +
            grabOffset.z;

        grabbedObject.userData
            .velocity
            .set(
                0,
                0,
                0
            );
    }

    /* =====================
       RELEASE
       ===================== */

    if (
        !pinching &&
        grabbedObject
    ) {

        releaseObject();
    }
}

/* =========================
   RELEASE
   ========================= */

function releaseObject() {

    if (!grabbedObject) {
        return;
    }

    grabbedObject.userData.grabbed =
        false;

    grabbedObject =
        null;
}

/* =========================
   PHYSICS UPDATE
   ========================= */

function updatePhysics(
    deltaTime
) {

    if (!physicsEnabled) {
        return;
    }

    for (
        const object of objects
    ) {

        if (
            object.userData.grabbed
        ) {
            continue;
        }

        const velocity =
            object.userData.velocity;

        velocity.y -=
            3.5 *
            deltaTime;

        object.position.x +=
            velocity.x *
            deltaTime;

        object.position.y +=
            velocity.y *
            deltaTime;

        object.position.z +=
            velocity.z *
            deltaTime;

        if (
            object.position.y <
            -2
        ) {

            object.position.y =
                -2;

            velocity.y *=
                -0.55;

            velocity.x *=
                0.92;

            velocity.z *=
                0.92;
        }
    }
}

/* =========================
   ANIMATION
   ========================= */

let lastTime =
    performance.now();

function animate() {

    requestAnimationFrame(
        animate
    );

    const now =
        performance.now();

    const deltaTime =
        Math.min(
            (
                now -
                lastTime
            ) / 1000,
            0.05
        );

    lastTime =
        now;

    updateHandInteraction();

    updatePhysics(
        deltaTime
    );

    for (
        const object of objects
    ) {

        if (
            object !==
            grabbedObject
        ) {

            object.rotation.y +=
                0.003;
        }
    }

    if (renderer) {

        renderer.render(
            scene,
            threeCamera
        );
    }
}

/* =========================
   RESIZE
   ========================= */

function resizeScene() {

    if (
        !renderer ||
        !threeCamera
    ) {
        return;
    }

    threeCamera.aspect =
        window.innerWidth /
        window.innerHeight;

    threeCamera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
}

/* =========================
   SCENE DATA
   ========================= */

function getSceneObjects() {

    return objects.map(
        object => ({

            type:
                object.userData.type,

            position: {
                x:
                    object.position.x,

                y:
                    object.position.y,

                z:
                    object.position.z
            },

            rotation: {
                x:
                    object.rotation.x,

                y:
                    object.rotation.y,

                z:
                    object.rotation.z
            },

            scale: {
                x:
                    object.scale.x,

                y:
                    object.scale.y,

                z:
                    object.scale.z
            }
        })
    );
}

/* =========================
   GLOBAL FUNCTIONS
   ========================= */

window.addObject =
    addObject;

window.deleteSelected =
    deleteSelected;

window.duplicateSelected =
    duplicateSelected;

window.resetScene =
    resetScene;

window.togglePhysics =
    togglePhysics;

window.getSceneObjects =
    getSceneObjects;

window.getSelectedObject =
    () => selectedObject;

/* =========================
   START
   ========================= */

window.addEventListener(
    "load",
    () => {
        initScene();
    }
);

console.log(
    "JARVIS: Scene loaded"
);
