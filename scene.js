```javascript
console.log("JARVIS: Scene starting");


/* =========================================================
   JARVIS SCENE
   ========================================================= */

const JARVIS_SCENE = {

    scene: null,
    camera: null,
    renderer: null,

    objects: [],
    selected: null,

    physics: false,
    gravity: -0.012,

    initialized: false
};


window.JARVIS_SCENE = JARVIS_SCENE;


/* =========================================================
   HAND STATE
   ========================================================= */

let grabbedObject = null;

let grabOffset =
    new THREE.Vector3();

let latestHandPosition =
    new THREE.Vector3();

let previousHandPosition =
    new THREE.Vector3();

let handVelocity =
    new THREE.Vector3();

let lastHandUpdate =
    performance.now();

let handPinching = false;

let wasPinching = false;


/* =========================================================
   WORLD
   ========================================================= */

const WORLD_WIDTH = 8;
const WORLD_HEIGHT = 4.5;


/* =========================================================
   INITIALIZE
   ========================================================= */

function initScene() {

    if (JARVIS_SCENE.initialized) {
        return;
    }


    const canvas =
        document.getElementById("scene");


    if (!canvas) {

        console.error(
            "JARVIS: Scene canvas missing"
        );

        return;
    }


    JARVIS_SCENE.scene =
        new THREE.Scene();


    JARVIS_SCENE.camera =
        new THREE.PerspectiveCamera(

            55,

            window.innerWidth /
            window.innerHeight,

            0.1,

            100

        );


    JARVIS_SCENE.camera.position.z =
        8;


    JARVIS_SCENE.renderer =
        new THREE.WebGLRenderer({

            canvas: canvas,

            alpha: true,

            antialias: true

        });


    JARVIS_SCENE.renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio,
            2
        )
    );


    JARVIS_SCENE.renderer.setSize(

        window.innerWidth,

        window.innerHeight

    );


    /* LIGHT */

    const ambient =
        new THREE.AmbientLight(
            0xffffff,
            1.2
        );

    JARVIS_SCENE.scene.add(
        ambient
    );


    const light =
        new THREE.PointLight(
            0x00ffff,
            5,
            50
        );


    light.position.set(
        0,
        3,
        5
    );


    JARVIS_SCENE.scene.add(
        light
    );


    JARVIS_SCENE.initialized =
        true;


    window.addEventListener(
        "resize",
        resizeScene
    );


    requestAnimationFrame(
        animateScene
    );


    console.log(
        "JARVIS: Scene ready"
    );
}


/* =========================================================
   MATERIAL
   ========================================================= */

function createMaterial() {

    return new THREE.MeshStandardMaterial({

        color: 0x00d9ff,

        emissive: 0x004c55,

        emissiveIntensity: 1.4,

        transparent: true,

        opacity: 0.88,

        metalness: 0.3,

        roughness: 0.25

    });
}


/* =========================================================
   GEOMETRY
   ========================================================= */

function createGeometry(type) {

    switch (type) {

        case "sphere":

            return new THREE.SphereGeometry(
                0.6,
                32,
                32
            );


        case "cylinder":

            return new THREE.CylinderGeometry(
                0.55,
                0.55,
                1.2,
                32
            );


        case "pyramid":

            return new THREE.ConeGeometry(
                0.7,
                1.2,
                4
            );


        case "torus":

            return new THREE.TorusGeometry(
                0.65,
                0.2,
                20,
                40
            );


        case "cube":

        default:

            return new THREE.BoxGeometry(
                1,
                1,
                1
            );
    }
}


/* =========================================================
   ADD OBJECT
   ========================================================= */

function addObject(

    type,

    position = {
        x: 0,
        y: 0,
        z: 0
    },

    scale = 1,

    name = type

) {

    const mesh =
        new THREE.Mesh(

            createGeometry(type),

            createMaterial()

        );


    mesh.name =
        name;


    mesh.position.set(

        position.x,

        position.y,

        position.z

    );


    mesh.scale.setScalar(
        scale
    );


    mesh.userData.type =
        type;


    mesh.userData.mass =
        1;


    mesh.userData.velocity =
        new THREE.Vector3();


    mesh.userData.grabbed =
        false;


    JARVIS_SCENE.scene.add(
        mesh
    );


    JARVIS_SCENE.objects.push(
        mesh
    );


    selectObject(
        mesh
    );


    updateCounts();


    return mesh;
}


/* =========================================================
   SELECT
   ========================================================= */

function selectObject(object) {

    if (
        JARVIS_SCENE.selected &&
        JARVIS_SCENE.selected.material
    ) {

        JARVIS_SCENE.selected
            .material
            .emissiveIntensity =
            1.4;
    }


    JARVIS_SCENE.selected =
        object;


    if (
        object &&
        object.material
    ) {

        object.material
            .emissiveIntensity =
            3;
    }
}


/* =========================================================
   REMOVE
   ========================================================= */

function removeObject(object) {

    if (!object) {
        return;
    }


    if (
        grabbedObject ===
        object
    ) {

        grabbedObject =
            null;
    }


    JARVIS_SCENE.scene.remove(
        object
    );


    if (object.geometry) {
        object.geometry.dispose();
    }


    if (object.material) {
        object.material.dispose();
    }


    JARVIS_SCENE.objects =
        JARVIS_SCENE.objects.filter(

            item =>
                item !== object

        );


    if (
        JARVIS_SCENE.selected ===
        object
    ) {

        JARVIS_SCENE.selected =
            null;
    }


    updateCounts();
}


/* =========================================================
   DUPLICATE
   ========================================================= */

function duplicateObject() {

    const original =
        JARVIS_SCENE.selected;


    if (!original) {
        return;
    }


    const clone =
        original.clone();


    clone.material =
        original.material.clone();


    clone.position.x +=
        1;


    clone.position.y +=
        0.5;


    clone.userData = {

        type:
            original.userData.type,

        mass:
            1,

        velocity:
            new THREE.Vector3(),

        grabbed:
            false

    };


    JARVIS_SCENE.scene.add(
        clone
    );


    JARVIS_SCENE.objects.push(
        clone
    );


    selectObject(
        clone
    );


    updateCounts();
}


/* =========================================================
   CLEAR
   ========================================================= */

function clearScene() {

    grabbedObject =
        null;


    const copy =
        [
            ...JARVIS_SCENE.objects
        ];


    for (
        const object of copy
    ) {

        removeObject(
            object
        );

    }


    JARVIS_SCENE.selected =
        null;


    updateCounts();
}


/* =========================================================
   MOVE
   ========================================================= */

function moveSelected(
    x,
    y,
    z
) {

    if (
        !JARVIS_SCENE.selected
    ) {
        return;
    }


    JARVIS_SCENE.selected
        .position
        .set(
            x,
            y,
            z
        );
}


/* =========================================================
   SCALE
   ========================================================= */

function scaleSelected(
    amount
) {

    if (
        !JARVIS_SCENE.selected
    ) {
        return;
    }


    JARVIS_SCENE.selected
        .scale
        .setScalar(
            amount
        );
}


/* =========================================================
   ROTATE
   ========================================================= */

function rotateSelected(
    x,
    y,
    z
) {

    if (
        !JARVIS_SCENE.selected
    ) {
        return;
    }


    JARVIS_SCENE.selected
        .rotation
        .set(
            x,
            y,
            z
        );
}


/* =========================================================
   HAND → WORLD
   ========================================================= */

function handPositionToWorld(point) {

    if (!point) {
        return null;
    }


    const mirroredX =
        1 - point.x;


    const x =
        (
            mirroredX -
            0.5
        ) *
        WORLD_WIDTH;


    const y =
        -(
            point.y -
            0.5
        ) *
        WORLD_HEIGHT;


    return new THREE.Vector3(
        x,
        y,
        0
    );
}


/* =========================================================
   PINCH
   ========================================================= */

function isPinching(
    landmarks
) {

    if (
        !landmarks ||
        landmarks.length <
        21
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


    return (
        distance <
        0.045
    );
}


/* =========================================================
   SCREEN POSITION
   ========================================================= */

function getFingerScreenPosition(
    point
) {

    if (!point) {
        return null;
    }


    return {

        x:
            (
                1 -
                point.x
            ) *
            window.innerWidth,

        y:
            point.y *
            window.innerHeight

    };
}


/* =========================================================
   OBJECT SCREEN POSITION
   ========================================================= */

function getObjectScreenPosition(
    object
) {

    const projected =
        object.position
            .clone()
            .project(
                JARVIS_SCENE.camera
            );


    return {

        x:
            (
                projected.x *
                0.5 +
                0.5
            ) *
            window.innerWidth,

        y:
            (
                -projected.y *
                0.5 +
                0.5
            ) *
            window.innerHeight

    };
}


/* =========================================================
   FIND OBJECT
   ========================================================= */

function findObjectUnderFinger(
    landmark
) {

    const finger =
        getFingerScreenPosition(
            landmark
        );


    if (!finger) {
        return null;
    }


    let closest =
        null;


    let closestDistance =
        Infinity;


    for (
        const object of
        JARVIS_SCENE.objects
    ) {

        const screen =
            getObjectScreenPosition(
                object
            );


        const dx =
            finger.x -
            screen.x;


        const dy =
            finger.y -
            screen.y;


        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        /*
           Tight grabbing area.
        */

        const radius =
            60 *
            Math.max(
                object.scale.x,
                0.5
            );


        if (
            distance <= radius &&
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


/* =========================================================
   RECEIVE HAND POSITION
   ========================================================= */

function updateHandTarget() {

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

        handPinching =
            false;

        return;
    }


    const landmarks =
        hands[0];


    if (
        !landmarks ||
        landmarks.length <
        21
    ) {

        return;
    }


    const indexTip =
        landmarks[8];


    const position =
        handPositionToWorld(
            indexTip
        );


    if (!position) {
        return;
    }


    /*
       Calculate hand velocity
       whenever MediaPipe gives
       us a new hand position.
    */

    const now =
        performance.now();


    const dt =
        (
            now -
            lastHandUpdate
        ) /
        1000;


    if (
        dt > 0.001 &&
        dt < 0.25
    ) {

        handVelocity
            .subVectors(
                position,
                latestHandPosition
            )
            .divideScalar(
                dt
            );

    }


    previousHandPosition.copy(
        latestHandPosition
    );


    latestHandPosition.copy(
        position
    );


    lastHandUpdate =
        now;


    handPinching =
        isPinching(
            landmarks
        );


    /*
       Grab ONLY on the transition
       from not pinching → pinching.
    */

    if (
        handPinching &&
        !wasPinching &&
        !grabbedObject
    ) {

        const target =
            findObjectUnderFinger(
                indexTip
            );


        if (target) {

            grabbedObject =
                target;


            JARVIS_SCENE.selected =
                target;


            target.userData.grabbed =
                true;


            grabOffset
                .copy(
                    target.position
                )
                .sub(
                    latestHandPosition
                );


            if (
                target.material
            ) {

                target.material
                    .emissiveIntensity =
                    4;
            }


            console.log(
                "JARVIS: Grabbed",
                target.name
            );
        }
    }


    wasPinching =
        handPinching;
}


/* =========================================================
   FOLLOW GRABBED OBJECT
   ========================================================= */

function updateGrabbedObject() {

    if (
        !grabbedObject
    ) {

        return;
    }


    if (!handPinching) {

        releaseObject();

        return;
    }


    /*
       PREDICTION

       MediaPipe may update at
       20–30 frames per second.

       The browser renders at
       roughly 60 frames per second.

       We use the latest velocity
       to predict slightly ahead.
    */

    const predictionTime =
        0.025;


    const predicted =
        latestHandPosition
            .clone()
            .add(

                handVelocity
                    .clone()
                    .multiplyScalar(
                        predictionTime
                    )

            );


    /*
       Direct positioning.

       No lerp.
       No smoothing.
    */

    grabbedObject.position.x =
        predicted.x +
        grabOffset.x;


    grabbedObject.position.y =
        predicted.y +
        grabOffset.y;


    grabbedObject.position.z =
        0;


    grabbedObject.userData
        .velocity
        .set(
            0,
            0,
            0
        );
}


/* =========================================================
   RELEASE
   ========================================================= */

function releaseObject() {

    if (!grabbedObject) {
        return;
    }


    grabbedObject.userData.grabbed =
        false;


    if (
        grabbedObject.material
    ) {

        grabbedObject.material
            .emissiveIntensity =
            3;
    }


    /*
       Small release velocity
       for physics.
    */

    grabbedObject.userData
        .velocity
        .copy(
            handVelocity
        )
        .multiplyScalar(
            0.015
        );


    console.log(
        "JARVIS: Released"
    );


    grabbedObject =
        null;
}


/* =========================================================
   PHYSICS
   ========================================================= */

function updatePhysics() {

    if (
        !JARVIS_SCENE.physics
    ) {

        return;
    }


    for (
        const object of
        JARVIS_SCENE.objects
    ) {

        if (
            object ===
            grabbedObject
        ) {

            continue;
        }


        const velocity =
            object.userData.velocity;


        velocity.y +=
            JARVIS_SCENE.gravity;


        object.position.add(
            velocity
        );


        if (
            object.position.y <
            -2.7
        ) {

            object.position.y =
                -2.7;


            velocity.y *=
                -0.45;


            velocity.x *=
                0.96;


            velocity.z *=
                0.96;
        }
    }
}


/* =========================================================
   ANIMATION
   ========================================================= */

function animateScene() {

    requestAnimationFrame(
        animateScene
    );


    /*
       First get the newest
       MediaPipe information.
    */

    updateHandTarget();


    /*
       Then update the grabbed
       object EVERY browser frame.
    */

    updateGrabbedObject();


    updatePhysics();


    /*
       Rotate free objects.
    */

    for (
        const object of
        JARVIS_SCENE.objects
    ) {

        if (
            object !==
            grabbedObject
        ) {

            object.rotation.y +=
                0.003;
        }
    }


    if (
        JARVIS_SCENE.renderer
    ) {

        JARVIS_SCENE.renderer.render(

            JARVIS_SCENE.scene,

            JARVIS_SCENE.camera

        );
    }


    updateCounts();
}


/* =========================================================
   RESIZE
   ========================================================= */

function resizeScene() {

    if (
        !JARVIS_SCENE.camera ||
        !JARVIS_SCENE.renderer
    ) {

        return;
    }


    JARVIS_SCENE.camera.aspect =
        window.innerWidth /
        window.innerHeight;


    JARVIS_SCENE.camera.updateProjectionMatrix();


    JARVIS_SCENE.renderer.setSize(

        window.innerWidth,

        window.innerHeight

    );
}


/* =========================================================
   COUNTS
   ========================================================= */

function updateCounts() {

    const objectText =
        document.getElementById(
            "objectText"
        );


    const handText =
        document.getElementById(
            "handText"
        );


    if (objectText) {

        objectText.textContent =
            JARVIS_SCENE.objects.length;
    }


    if (
        handText &&
        typeof getHandLandmarks ===
        "function"
    ) {

        const hands =
            getHandLandmarks();


        handText.textContent =
            hands
                ? hands.length
                : 0;
    }
}


/* =========================================================
   GLOBALS
   ========================================================= */

window.initScene =
    initScene;


window.addObject =
    addObject;


window.removeObject =
    removeObject;


window.duplicateObject =
    duplicateObject;


window.clearScene =
    clearScene;


window.moveSelected =
    moveSelected;


window.scaleSelected =
    scaleSelected;


window.rotateSelected =
    rotateSelected;


window.getSceneObjects =
    getSceneObjects;


window.selectObject =
    selectObject;


window.updateCounts =
    updateCounts;


/* =========================================================
   SCENE DATA
   ========================================================= */

function getSceneObjects() {

    return JARVIS_SCENE.objects.map(

        object => ({

            name:
                object.name,

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


console.log(
    "JARVIS: Scene loaded"
);
```
