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
   HAND GRABBING
   ========================================================= */

let grabbedObject = null;

let grabOffset =
    new THREE.Vector3();

let lastHandPosition =
    new THREE.Vector3();

let currentHandPosition =
    new THREE.Vector3();

let handVelocity =
    new THREE.Vector3();

let lastHandTime =
    performance.now();

let wasPinching = false;


/* =========================================================
   WORLD SETTINGS
   ========================================================= */

const WORLD_WIDTH = 8;

const WORLD_HEIGHT = 4.5;


/* =========================================================
   INITIALIZE SCENE
   ========================================================= */

function initScene() {

    /*
       Prevent the scene from being
       initialized twice.
    */

    if (JARVIS_SCENE.initialized) {

        console.log(
            "JARVIS: Scene already initialized"
        );

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


    /* THREE SCENE */

    JARVIS_SCENE.scene =
        new THREE.Scene();


    /* CAMERA */

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


    /* RENDERER */

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


    /*
       Small hologram grid.
    */

    const grid =
        new THREE.GridHelper(
            20,
            20,
            0x00ffff,
            0x003344
        );


    grid.rotation.x =
        Math.PI / 2;


    grid.position.z =
        -1.5;


    grid.material.transparent =
        true;


    grid.material.opacity =
        0.15;


    JARVIS_SCENE.scene.add(
        grid
    );


    JARVIS_SCENE.initialized =
        true;


    window.addEventListener(
        "resize",
        resizeScene
    );


    animateScene();


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
   CREATE GEOMETRY
   ========================================================= */

function createGeometry(type) {

    switch (type) {

        case "cube":

            return new THREE.BoxGeometry(
                1,
                1,
                1
            );


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


        default:

            return new THREE.BoxGeometry(
                1,
                1,
                1
            );
    }
}


/* =========================================================
   CREATE MESH
   ========================================================= */

function createMesh(type) {

    const geometry =
        createGeometry(type);


    const mesh =
        new THREE.Mesh(
            geometry,
            createMaterial()
        );


    return mesh;
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
        createMesh(type);


    mesh.name =
        name;


    mesh.position.set(

        position.x,

        position.y,

        position.z

    );


    mesh.scale.set(

        scale,

        scale,

        scale

    );


    mesh.userData.type =
        type;


    mesh.userData.mass =
        1;


    mesh.userData.velocity =
        new THREE.Vector3(
            0,
            0,
            0
        );


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


    console.log(
        "JARVIS: Added",
        type
    );


    return mesh;
}


/* =========================================================
   SELECT OBJECT
   ========================================================= */

function selectObject(object) {

    /*
       Turn previous object back
       to normal brightness.
    */

    if (
        JARVIS_SCENE.selected
    ) {

        if (
            JARVIS_SCENE.selected.material
        ) {

            JARVIS_SCENE.selected
                .material
                .emissiveIntensity =
                1.4;

        }

    }


    JARVIS_SCENE.selected =
        object;


    if (object) {

        if (object.material) {

            object.material
                .emissiveIntensity =
                3;

        }


        const modeText =
            document.getElementById(
                "modeText"
            );


        if (modeText) {

            modeText.textContent =
                "SELECTED";

        }

    }
}


/* =========================================================
   REMOVE OBJECT
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
   DUPLICATE OBJECT
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
            new THREE.Vector3(
                0,
                0,
                0
            ),

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
   CLEAR SCENE
   ========================================================= */

function clearScene() {

    grabbedObject =
        null;


    const allObjects =
        [
            ...JARVIS_SCENE.objects
        ];


    for (
        const object of allObjects
    ) {

        removeObject(
            object
        );

    }


    JARVIS_SCENE.selected =
        null;


    updateCounts();


    const modeText =
        document.getElementById(
            "modeText"
        );


    if (modeText) {

        modeText.textContent =
            "IDLE";

    }
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

        return;

    }


    JARVIS_SCENE.selected.position.set(
        x,
        y,
        z
    );
}


/* =========================================================
   SCALE SELECTED
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
   HAND POSITION
   ========================================================= */

function handPositionToWorld(
    point
) {

    if (!point) {

        return null;

    }


    /*
       Your camera AND hand canvas
       are mirrored in CSS.

       Reverse MediaPipe X once
       so physical hand movement
       matches the hologram.
    */

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
   PINCH DETECTION
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


    /*
       Slightly tighter pinch.
    */

    return (
        distance <
        0.045
    );
}


/* =========================================================
   GET FINGER SCREEN POSITION
   ========================================================= */

function getFingerScreenPosition(
    point
) {

    if (!point) {

        return null;

    }


    const canvas =
        document.getElementById(
            "scene"
        );


    if (!canvas) {

        return null;

    }


    /*
       The camera is visually mirrored.

       Use the same mirrored X
       that the 3D scene uses.
    */

    const x =
        1 -
        point.x;


    return {

        x:
            x *
            window.innerWidth,

        y:
            point.y *
            window.innerHeight

    };
}


/* =========================================================
   GET OBJECT SCREEN POSITION
   ========================================================= */

function getObjectScreenPosition(
    object
) {

    if (
        !object ||
        !JARVIS_SCENE.camera
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


        /*
           Grab radius is based on
           the actual object size.

           This prevents a pinch
           somewhere else on the screen
           from grabbing it.
        */

        const baseRadius =
            55;


        const objectRadius =
            baseRadius *
            Math.max(
                object.scale.x,
                0.5
            );


        if (
            distance <=
            objectRadius
        ) {

            if (
                distance <
                closestDistance
            ) {

                closest =
                    object;

                closestDistance =
                    distance;

            }

        }

    }


    return closest;
}


/* =========================================================
   UPDATE HAND VELOCITY
   ========================================================= */

function updateHandVelocity(
    position
) {

    const now =
        performance.now();


    const elapsed =
        (
            now -
            lastHandTime
        ) /
        1000;


    if (
        elapsed > 0 &&
        elapsed < 0.2
    ) {

        handVelocity
            .subVectors(
                position,
                lastHandPosition
            )
            .divideScalar(
                elapsed
            );

    }


    lastHandPosition.copy(
        position
    );


    lastHandTime =
        now;

}


/* =========================================================
   UPDATE HAND INTERACTION
   ========================================================= */

function updateHandInteraction() {

    if (
        typeof getHandLandmarks !==
        "function"
    ) {

        return;

    }


    const hands =
        getHandLandmarks();


    /*
       No hands.

       Drop the object.
    */

    if (
        !hands ||
        hands.length === 0
    ) {

        if (grabbedObject) {

            releaseObject();

        }

        return;

    }


    /*
       Use the first detected hand.
    */

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


    const worldPosition =
        handPositionToWorld(
            indexTip
        );


    if (!worldPosition) {

        return;

    }


    currentHandPosition.copy(
        worldPosition
    );


    updateHandVelocity(
        worldPosition
    );


    const pinching =
        isPinching(
            landmarks
        );


    /* =====================================================
       START GRAB
       ===================================================== */

    if (
        pinching &&
        !wasPinching &&
        !grabbedObject
    ) {

        /*
           IMPORTANT:

           We check the actual SCREEN
           location of the fingertip
           against the actual SCREEN
           location of the object.

           This fixes the "pinch anywhere"
           problem.
        */

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


            /*
               Preserve the exact point
               where the finger grabbed it.
            */

            grabOffset
                .copy(
                    target.position
                )
                .sub(
                    worldPosition
                );


            if (
                target.material
            ) {

                target.material
                    .emissiveIntensity =
                    4;

            }


            console.log(
                "JARVIS: Object grabbed"
            );

        }

    }


    /* =====================================================
       FOLLOW HAND
       ===================================================== */

    if (
        pinching &&
        grabbedObject
    ) {

        /*
           DIRECT FOLLOW.

           No lerp.
           No smoothing.
           No delay intentionally added.

           Every animation frame uses
           the newest MediaPipe position.
        */

        grabbedObject.position.x =
            worldPosition.x +
            grabOffset.x;


        grabbedObject.position.y =
            worldPosition.y +
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


    /* =====================================================
       RELEASE
       ===================================================== */

    if (
        !pinching &&
        wasPinching &&
        grabbedObject
    ) {

        releaseObject();

    }


    wasPinching =
        pinching;

}


/* =========================================================
   RELEASE OBJECT
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
       Give the object a tiny amount
       of hand momentum when released.

       This is only used when physics
       is enabled.
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
        "JARVIS: Object released"
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


        const bottom =
            -2.7;


        if (
            object.position.y <
            bottom
        ) {

            object.position.y =
                bottom;


            velocity.y *=
                -0.45;


            velocity.x *=
                0.96;


            velocity.z *=
                0.96;

        }

    }


    /*
       Simple object collision.
    */

    const objects =
        JARVIS_SCENE.objects;


    for (
        let i = 0;
        i < objects.length;
        i++
    ) {

        for (
            let j = i + 1;
            j < objects.length;
            j++
        ) {

            const a =
                objects[i];


            const b =
                objects[j];


            if (
                a === grabbedObject ||
                b === grabbedObject
            ) {

                continue;

            }


            const distance =
                a.position.distanceTo(
                    b.position
                );


            const minimum =
                0.65 *
                (
                    a.scale.x +
                    b.scale.x
                );


            if (
                distance > 0 &&
                distance < minimum
            ) {

                const direction =
                    new THREE.Vector3()
                        .subVectors(
                            a.position,
                            b.position
                        )
                        .normalize();


                const push =
                    (
                        minimum -
                        distance
                    ) *
                    0.5;


                a.position.add(
                    direction
                        .clone()
                        .multiplyScalar(
                            push
                        )
                );


                b.position.add(
                    direction
                        .clone()
                        .multiplyScalar(
                            -push
                        )
                );

            }

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
       Hand interaction is updated
       BEFORE rendering.

       This makes the object appear
       as responsive as possible.
    */

    updateHandInteraction();


    updatePhysics();


    /*
       Rotate objects that are
       not currently grabbed.
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

    const handText =
        document.getElementById(
            "handText"
        );


    const objectText =
        document.getElementById(
            "objectText"
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
   PROJECT DATA
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


/* =========================================================
   GLOBAL FUNCTIONS
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
   START
   ========================================================= */

console.log(
    "JARVIS: Scene loaded"
);
