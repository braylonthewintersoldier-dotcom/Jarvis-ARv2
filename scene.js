console.log("JARVIS: New Scene starting");

/* =========================================================
   JARVIS AR - COMPLETE SCENE ENGINE
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
   HAND CONTROL
   ========================================================= */

let grabbedObject = null;

let grabOffset = new THREE.Vector3();

let latestHandWorld = new THREE.Vector3();
let latestFingerScreen = null;

let handVelocity = new THREE.Vector3();
let lastHandWorld = new THREE.Vector3();

let lastHandTime = performance.now();

let handPinching = false;
let previousPinching = false;

let activeHand = null;


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

    const canvas = document.getElementById("scene");

    if (!canvas) {
        console.error("JARVIS: Scene canvas not found");
        return;
    }

    JARVIS_SCENE.scene = new THREE.Scene();

    JARVIS_SCENE.camera = new THREE.PerspectiveCamera(
        55,
        window.innerWidth / window.innerHeight,
        0.1,
        100
    );

    JARVIS_SCENE.camera.position.set(0, 0, 8);

    JARVIS_SCENE.renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true
    });

    JARVIS_SCENE.renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, 2)
    );

    JARVIS_SCENE.renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );


    /* =====================================================
       LIGHTING
       ===================================================== */

    const ambient = new THREE.AmbientLight(
        0xffffff,
        1.2
    );

    JARVIS_SCENE.scene.add(ambient);


    const cyanLight = new THREE.PointLight(
        0x00ffff,
        5,
        50
    );

    cyanLight.position.set(
        0,
        3,
        5
    );

    JARVIS_SCENE.scene.add(cyanLight);


    /* =====================================================
       OPTIONAL GRID
       ===================================================== */

    const grid = new THREE.GridHelper(
        12,
        12,
        0x00ffff,
        0x003333
    );

    grid.rotation.x = Math.PI / 2;
    grid.position.z = -1;

    grid.material.transparent = true;
    grid.material.opacity = 0.12;

    JARVIS_SCENE.scene.add(grid);


    JARVIS_SCENE.initialized = true;

    window.addEventListener(
        "resize",
        resizeScene
    );

    requestAnimationFrame(
        animateScene
    );

    updateCounts();

    console.log("JARVIS: New Scene ready");
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

    switch (String(type).toLowerCase()) {

        case "sphere":

            return new THREE.SphereGeometry(
                0.6,
                32,
                24
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


        case "star":

            return createStarGeometry();


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
   STAR
   ========================================================= */

function createStarGeometry() {

    const shape = new THREE.Shape();

    const points = 10;

    const outerRadius = 0.75;
    const innerRadius = 0.32;

    for (let i = 0; i < points; i++) {

        const angle =
            -Math.PI / 2 +
            i * Math.PI / 5;

        const radius =
            i % 2 === 0
                ? outerRadius
                : innerRadius;

        const x =
            Math.cos(angle) * radius;

        const y =
            Math.sin(angle) * radius;

        if (i === 0) {
            shape.moveTo(x, y);
        } else {
            shape.lineTo(x, y);
        }
    }

    shape.closePath();

    const geometry =
        new THREE.ExtrudeGeometry(
            shape,
            {
                depth: 0.35,
                bevelEnabled: false
            }
        );

    geometry.center();

    return geometry;
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

    if (!JARVIS_SCENE.initialized) {
        initScene();
    }

    if (
        !JARVIS_SCENE.scene
    ) {
        console.error(
            "JARVIS: Scene not initialized"
        );

        return null;
    }


    const mesh = new THREE.Mesh(
        createGeometry(type),
        createMaterial()
    );


    mesh.name =
        name || String(type).toUpperCase();


    mesh.position.set(
        Number(position.x) || 0,
        Number(position.y) || 0,
        Number(position.z) || 0
    );


    mesh.scale.setScalar(
        Math.max(
            0.05,
            Number(scale) || 1
        )
    );


    mesh.userData.type =
        String(type).toLowerCase();

    mesh.userData.mass = 1;

    mesh.userData.velocity =
        new THREE.Vector3();

    mesh.userData.grabbed = false;

    mesh.userData.createdAt =
        Date.now();


    JARVIS_SCENE.scene.add(mesh);

    JARVIS_SCENE.objects.push(mesh);

    selectObject(mesh);

    updateCounts();

    console.log(
        "JARVIS: Created",
        mesh.name
    );

    return mesh;
}


/* =========================================================
   CREATE DEFAULT OBJECT
   ========================================================= */

function createObject(type) {

    return addObject(
        type,
        {
            x: 0,
            y: 0,
            z: 0
        },
        1,
        String(type).toUpperCase()
    );
}


/* =========================================================
   SELECT OBJECT
   ========================================================= */

function selectObject(object) {

    if (
        JARVIS_SCENE.selected &&
        JARVIS_SCENE.selected.material
    ) {

        JARVIS_SCENE.selected
            .material
            .emissiveIntensity = 1.4;
    }


    JARVIS_SCENE.selected =
        object || null;


    if (
        object &&
        object.material
    ) {

        object.material
            .emissiveIntensity = 3;
    }


    updateCounts();
}


/* =========================================================
   REMOVE OBJECT
   ========================================================= */

function removeObject(object) {

    if (!object) {
        return;
    }


    if (
        grabbedObject === object
    ) {

        grabbedObject = null;

        activeHand = null;

        handPinching = false;

        previousPinching = false;
    }


    if (
        JARVIS_SCENE.scene
    ) {

        JARVIS_SCENE.scene.remove(
            object
        );
    }


    if (object.geometry) {
        object.geometry.dispose();
    }


    if (object.material) {

        if (
            Array.isArray(
                object.material
            )
        ) {

            object.material.forEach(
                material =>
                    material.dispose()
            );

        } else {

            object.material.dispose();
        }
    }


    JARVIS_SCENE.objects =
        JARVIS_SCENE.objects.filter(
            item => item !== object
        );


    if (
        JARVIS_SCENE.selected === object
    ) {

        JARVIS_SCENE.selected = null;
    }


    updateCounts();
}


/* =========================================================
   DELETE SELECTED
   ========================================================= */

function deleteSelected() {

    if (
        !JARVIS_SCENE.selected
    ) {
        return false;
    }

    removeObject(
        JARVIS_SCENE.selected
    );

    return true;
}


/* =========================================================
   DUPLICATE
   ========================================================= */

function duplicateObject() {

    const original =
        JARVIS_SCENE.selected;

    if (!original) {
        return null;
    }


    const clone =
        original.clone();


    clone.material =
        original.material.clone();


    clone.position.copy(
        original.position
    );

    clone.position.x += 0.8;
    clone.position.y += 0.5;


    clone.rotation.copy(
        original.rotation
    );


    clone.scale.copy(
        original.scale
    );


    clone.userData.type =
        original.userData.type;

    clone.userData.mass = 1;

    clone.userData.velocity =
        new THREE.Vector3();

    clone.userData.grabbed =
        false;

    clone.userData.createdAt =
        Date.now();


    clone.name =
        original.name + " Copy";


    JARVIS_SCENE.scene.add(
        clone
    );

    JARVIS_SCENE.objects.push(
        clone
    );


    selectObject(clone);

    updateCounts();

    return clone;
}


/* =========================================================
   CLEAR SCENE
   ========================================================= */

function clearScene() {

    grabbedObject = null;

    activeHand = null;

    handPinching = false;

    previousPinching = false;


    const copy =
        [...JARVIS_SCENE.objects];


    for (
        const object of copy
    ) {

        removeObject(object);
    }


    JARVIS_SCENE.selected =
        null;


    updateCounts();

    console.log(
        "JARVIS: Scene cleared"
    );
}


/* =========================================================
   MOVE SELECTED
   ========================================================= */

function moveSelected(
    x,
    y,
    z
) {

    if (
        !JARVIS_SCENE.selected
    ) {
        return false;
    }


    JARVIS_SCENE.selected.position.set(
        Number(x) || 0,
        Number(y) || 0,
        Number(z) || 0
    );


    return true;
}


/* =========================================================
   MOVE SELECTED BY AMOUNT
   ========================================================= */

function moveSelectedBy(
    x = 0,
    y = 0,
    z = 0
) {

    if (
        !JARVIS_SCENE.selected
    ) {
        return false;
    }


    JARVIS_SCENE.selected.position.x +=
        Number(x) || 0;

    JARVIS_SCENE.selected.position.y +=
        Number(y) || 0;

    JARVIS_SCENE.selected.position.z +=
        Number(z) || 0;


    return true;
}


/* =========================================================
   SCALE SELECTED
   ========================================================= */

function scaleSelected(amount) {

    if (
        !JARVIS_SCENE.selected
    ) {
        return false;
    }


    const value =
        Math.max(
            0.05,
            Number(amount) || 1
        );


    JARVIS_SCENE.selected
        .scale
        .setScalar(value);


    return true;
}


/* =========================================================
   SCALE SELECTED BY AMOUNT
   ========================================================= */

function scaleSelectedBy(amount) {

    if (
        !JARVIS_SCENE.selected
    ) {
        return false;
    }


    const current =
        JARVIS_SCENE.selected.scale.x;


    const value =
        Math.max(
            0.05,
            current +
            (Number(amount) || 0)
        );


    JARVIS_SCENE.selected
        .scale
        .setScalar(value);


    return true;
}


/* =========================================================
   ROTATE SELECTED
   ========================================================= */

function rotateSelected(
    x,
    y,
    z
) {

    if (
        !JARVIS_SCENE.selected
    ) {
        return false;
    }


    JARVIS_SCENE.selected.rotation.set(
        Number(x) || 0,
        Number(y) || 0,
        Number(z) || 0
    );


    return true;
}


/* =========================================================
   ROTATE SELECTED BY AMOUNT
   ========================================================= */

function rotateSelectedBy(
    x = 0,
    y = 0,
    z = 0
) {

    if (
        !JARVIS_SCENE.selected
    ) {
        return false;
    }


    JARVIS_SCENE.selected.rotation.x +=
        Number(x) || 0;

    JARVIS_SCENE.selected.rotation.y +=
        Number(y) || 0;

    JARVIS_SCENE.selected.rotation.z +=
        Number(z) || 0;


    return true;
}


/* =========================================================
   HAND PINCH DETECTION
   ========================================================= */

function isPinching(landmarks) {

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
        thumb.x - index.x;

    const dy =
        thumb.y - index.y;

    const dz =
        thumb.z - index.z;


    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy +
            dz * dz
        );


    return distance < 0.055;
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
            mirroredX - 0.5
        ) * WORLD_WIDTH;


    const y =
        -(
            point.y - 0.5
        ) * WORLD_HEIGHT;


    return new THREE.Vector3(
        x,
        y,
        0
    );
}


/* =========================================================
   HAND → SCREEN
   ========================================================= */

function getFingerScreenPosition(point) {

    if (!point) {
        return null;
    }


    return {

        x:
            (1 - point.x) *
            window.innerWidth,

        y:
            point.y *
            window.innerHeight
    };
}


/* =========================================================
   OBJECT → SCREEN
   ========================================================= */

function getObjectScreenPosition(object) {

    if (
        !JARVIS_SCENE.camera ||
        !object
    ) {
        return null;
    }


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
   FIND OBJECT UNDER FINGER
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


    let closest = null;

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


        if (!screen) {
            continue;
        }


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


        const radius =
            Math.max(
                55,
                65 *
                object.scale.x
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
   GET HAND LANDMARKS SAFELY
   ========================================================= */

function getSafeHands() {

    if (
        typeof getHandLandmarks !==
        "function"
    ) {
        return [];
    }


    try {

        const hands =
            getHandLandmarks();


        if (
            !Array.isArray(hands)
        ) {
            return [];
        }


        return hands;

    } catch (error) {

        console.warn(
            "JARVIS: Could not read hands",
            error
        );

        return [];
    }
}


/* =========================================================
   UPDATE HAND
   ========================================================= */

function updateHandState() {

    const hands =
        getSafeHands();


    if (
        !hands ||
        hands.length === 0
    ) {

        handPinching = false;

        activeHand = null;


        if (grabbedObject) {
            releaseObject();
        }


        previousPinching =
            false;


        updateCounts();

        return;
    }


    /*
       First detected hand is used
       for predictable grabbing.
    */

    const landmarks =
        hands[0];


    if (
        !landmarks ||
        landmarks.length < 21
    ) {
        return;
    }


    const indexTip =
        landmarks[8];


    const world =
        handPositionToWorld(
            indexTip
        );


    const screen =
        getFingerScreenPosition(
            indexTip
        );


    if (
        !world ||
        !screen
    ) {
        return;
    }


    const now =
        performance.now();


    const dt =
        (now - lastHandTime) /
        1000;


    if (
        dt > 0.001 &&
        dt < 0.25
    ) {

        handVelocity
            .subVectors(
                world,
                lastHandWorld
            )
            .divideScalar(dt);


        /*
           Prevent huge velocity values
           from bad camera frames.
        */

        if (
            handVelocity.length() > 20
        ) {

            handVelocity
                .setLength(20);
        }
    }


    lastHandWorld.copy(
        world
    );

    latestHandWorld.copy(
        world
    );

    latestFingerScreen =
        screen;

    lastHandTime =
        now;


    handPinching =
        isPinching(
            landmarks
        );


    /*
       ONLY grab when pinch starts.
    */

    if (
        handPinching &&
        !previousPinching &&
        !grabbedObject
    ) {

        const target =
            findObjectUnderFinger(
                indexTip
            );


        if (target) {

            grabbedObject =
                target;

            activeHand = 0;


            selectObject(
                target
            );


            target.userData.grabbed =
                true;


            /*
               Preserve the exact point
               where the object was grabbed.
            */

            grabOffset
                .copy(
                    target.position
                )
                .sub(
                    latestHandWorld
                );


            if (
                target.material
            ) {

                target.material
                    .emissiveIntensity = 4;
            }


            if (
                target.userData.velocity
            ) {

                target.userData
                    .velocity
                    .set(0, 0, 0);
            }


            console.log(
                "JARVIS: Grabbed",
                target.name
            );
        }
    }


    previousPinching =
        handPinching;


    updateCounts();
}


/* =========================================================
   MOVE GRABBED OBJECT
   ========================================================= */

function updateGrabbedObject() {

    if (!grabbedObject) {
        return;
    }


    if (!handPinching) {

        releaseObject();

        return;
    }


    const targetX =
        latestHandWorld.x +
        grabOffset.x;


    const targetY =
        latestHandWorld.y +
        grabOffset.y;


    grabbedObject.position.x =
        targetX;


    grabbedObject.position.y =
        targetY;


    grabbedObject.position.z =
        0;


    if (
        grabbedObject.userData.velocity
    ) {

        grabbedObject.userData
            .velocity
            .set(0, 0, 0);
    }
}


/* =========================================================
   RELEASE
   ========================================================= */

function releaseObject() {

    if (!grabbedObject) {
        return;
    }


    const released =
        grabbedObject;


    released.userData.grabbed =
        false;


    if (
        released.material
    ) {

        released.material
            .emissiveIntensity = 3;
    }


    if (
        released.userData.velocity
    ) {

        released.userData.velocity
            .copy(handVelocity)
            .multiplyScalar(0.015);
    }


    console.log(
        "JARVIS: Released",
        released.name
    );


    grabbedObject =
        null;

    activeHand =
        null;
}


/* =========================================================
   PHYSICS ON/OFF
   ========================================================= */

function setPhysics(enabled) {

    JARVIS_SCENE.physics =
        Boolean(enabled);


    console.log(
        "JARVIS: Physics",
        JARVIS_SCENE.physics
            ? "ON"
            : "OFF"
    );


    updateCounts();

    return JARVIS_SCENE.physics;
}


function togglePhysics() {

    return setPhysics(
        !JARVIS_SCENE.physics
    );
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
            object === grabbedObject
        ) {
            continue;
        }


        if (
            object.userData.grabbed
        ) {
            continue;
        }


        const velocity =
            object.userData.velocity;


        if (!velocity) {
            continue;
        }


        velocity.y +=
            JARVIS_SCENE.gravity;


        object.position.add(
            velocity
        );


        /*
           Floor
        */

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


        /*
           Left/right walls
        */

        if (
            object.position.x <
            -4
        ) {

            object.position.x =
                -4;

            velocity.x *=
                -0.7;
        }


        if (
            object.position.x >
            4
        ) {

            object.position.x =
                4;

            velocity.x *=
                -0.7;
        }


        /*
           Top wall
        */

        if (
            object.position.y >
            2.25
        ) {

            object.position.y =
                2.25;

            velocity.y *=
                -0.7;
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


    updateHandState();

    updateGrabbedObject();

    updatePhysics();


    /*
       Subtle hologram rotation.
    */

    for (
        const object of
        JARVIS_SCENE.objects
    ) {

        if (
            object !== grabbedObject
        ) {

            object.rotation.y +=
                0.003;
        }
    }


    if (
        JARVIS_SCENE.renderer &&
        JARVIS_SCENE.scene &&
        JARVIS_SCENE.camera
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
   COUNTERS
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


    const physicsText =
        document.getElementById(
            "physicsText"
        );


    const selectedText =
        document.getElementById(
            "selectedText"
        );


    /*
       OBJECT COUNT
    */

    if (objectText) {

        objectText.textContent =
            String(
                JARVIS_SCENE.objects.length
            );
    }


    /*
       HAND COUNT
    */

    if (handText) {

        const hands =
            getSafeHands();


        handText.textContent =
            String(
                hands.length
            );
    }


    /*
       PHYSICS STATUS
    */

    if (physicsText) {

        physicsText.textContent =
            JARVIS_SCENE.physics
                ? "ON"
                : "OFF";
    }


    /*
       SELECTED OBJECT
    */

    if (selectedText) {

        selectedText.textContent =
            JARVIS_SCENE.selected
                ? JARVIS_SCENE.selected.name
                : "NONE";
    }
}


/* =========================================================
   GET OBJECT COUNT
   ========================================================= */

function getObjectCount() {

    return JARVIS_SCENE.objects.length;
}


/* =========================================================
   GET HAND COUNT
   ========================================================= */

function getHandCount() {

    return getSafeHands().length;
}


/* =========================================================
   GET SELECTED OBJECT
   ========================================================= */

function getSelectedObject() {

    return JARVIS_SCENE.selected;
}


/* =========================================================
   SET SELECTED OBJECT BY INDEX
   ========================================================= */

function selectObjectByIndex(index) {

    const i =
        Number(index);


    if (
        !Number.isInteger(i) ||
        i < 0 ||
        i >= JARVIS_SCENE.objects.length
    ) {

        return null;
    }


    const object =
        JARVIS_SCENE.objects[i];


    selectObject(object);


    return object;
}


/* =========================================================
   CREATE COMMON SHAPES
   ========================================================= */

function createCube() {
    return createObject("cube");
}


function createSphere() {
    return createObject("sphere");
}


function createPyramid() {
    return createObject("pyramid");
}


function createTorus() {
    return createObject("torus");
}


function createCylinder() {
    return createObject("cylinder");
}


function createStar() {
    return createObject("star");
}


/* =========================================================
   RESET SELECTED OBJECT
   ========================================================= */

function resetSelected() {

    if (
        !JARVIS_SCENE.selected
    ) {
        return false;
    }


    const object =
        JARVIS_SCENE.selected;


    object.position.set(
        0,
        0,
        0
    );


    object.rotation.set(
        0,
        0,
        0
    );


    object.scale.setScalar(
        1
    );


    if (
        object.userData.velocity
    ) {

        object.userData.velocity
            .set(0, 0, 0);
    }


    return true;
}


/* =========================================================
   START SCENE
   ========================================================= */

function startJARVISScene() {

    initScene();

    updateCounts();

    console.log(
        "JARVIS: Scene started"
    );
}


/* =========================================================
   GLOBAL API
   ========================================================= */

window.initScene =
    initScene;

window.addObject =
    addObject;

window.createObject =
    createObject;

window.createCube =
    createCube;

window.createSphere =
    createSphere;

window.createPyramid =
    createPyramid;

window.createTorus =
    createTorus;

window.createCylinder =
    createCylinder;

window.createStar =
    createStar;

window.selectObject =
    selectObject;

window.selectObjectByIndex =
    selectObjectByIndex;

window.removeObject =
    removeObject;

window.deleteSelected =
    deleteSelected;

window.duplicateObject =
    duplicateObject;

window.clearScene =
    clearScene;

window.moveSelected =
    moveSelected;

window.moveSelectedBy =
    moveSelectedBy;

window.scaleSelected =
    scaleSelected;

window.scaleSelectedBy =
    scaleSelectedBy;

window.rotateSelected =
    rotateSelected;

window.rotateSelectedBy =
    rotateSelectedBy;

window.resetSelected =
    resetSelected;

window.setPhysics =
    setPhysics;

window.togglePhysics =
    togglePhysics;

window.updateCounts =
    updateCounts;

window.getObjectCount =
    getObjectCount;

window.getHandCount =
    getHandCount;

window.getSelectedObject =
    getSelectedObject;

window.startJARVISScene =
    startJARVISScene;


/* =========================================================
   AUTO START
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        startJARVISScene
    );

} else {

    startJARVISScene();
}


console.log(
    "JARVIS: Complete Scene Engine loaded"
);
