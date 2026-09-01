```javascript
const JARVIS_HANDS = {
    hands: null,
    camera: null,
    detected: 0,
    grabbing: false,
    grabbed: null,
    lastPosition: null,
    twoHandStartDistance: null,
    twoHandStartScale: 1,
    twoHandStartAngle: null
};


// ========================================
// HAND TRACKING CANVAS
// ========================================

const handCanvas = document.getElementById("handCanvas");
const handCtx = handCanvas.getContext("2d");


function resizeHandCanvas() {
    const dpr = window.devicePixelRatio || 1;

    handCanvas.width = window.innerWidth * dpr;
    handCanvas.height = window.innerHeight * dpr;

    handCanvas.style.width = window.innerWidth + "px";
    handCanvas.style.height = window.innerHeight + "px";

    handCtx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );
}


resizeHandCanvas();

window.addEventListener(
    "resize",
    resizeHandCanvas
);


// ========================================
// HAND CONNECTIONS
// ========================================

const HAND_CONNECTIONS = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],

    [0, 5],
    [5, 6],
    [6, 7],
    [7, 8],

    [5, 9],
    [9, 10],
    [10, 11],
    [11, 12],

    [9, 13],
    [13, 14],
    [14, 15],
    [15, 16],

    [13, 17],
    [17, 18],
    [18, 19],
    [19, 20],

    [0, 17]
];


// ========================================
// DRAW HAND
// ========================================

function drawHand(landmarks) {

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Draw skeleton
    handCtx.beginPath();

    for (const connection of HAND_CONNECTIONS) {

        const a = landmarks[connection[0]];
        const b = landmarks[connection[1]];

        const ax = (1 - a.x) * width;
        const ay = a.y * height;

        const bx = (1 - b.x) * width;
        const by = b.y * height;

        handCtx.moveTo(ax, ay);
        handCtx.lineTo(bx, by);
    }

    handCtx.lineWidth = 2;
    handCtx.strokeStyle = "rgba(0, 234, 255, 0.9)";
    handCtx.stroke();


    // Draw joints
    for (let i = 0; i < landmarks.length; i++) {

        const point = landmarks[i];

        const x = (1 - point.x) * width;
        const y = point.y * height;

        const radius =
            i === 4 || i === 8
                ? 5
                : 3;

        handCtx.beginPath();

        handCtx.arc(
            x,
            y,
            radius,
            0,
            Math.PI * 2
        );

        handCtx.fillStyle =
            i === 4 || i === 8
                ? "white"
                : "rgba(0, 234, 255, 0.95)";

        handCtx.fill();
    }


    // Index fingertip targeting ring
    const index = landmarks[8];

    const ix = (1 - index.x) * width;
    const iy = index.y * height;

    handCtx.beginPath();

    handCtx.arc(
        ix,
        iy,
        11,
        0,
        Math.PI * 2
    );

    handCtx.lineWidth = 1;
    handCtx.strokeStyle =
        "rgba(0, 234, 255, 0.9)";

    handCtx.stroke();
}


// ========================================
// 3D DISTANCE
// ========================================

function distance3D(a, b) {

    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = (a.z || 0) - (b.z || 0);

    return Math.sqrt(
        dx * dx +
        dy * dy +
        dz * dz
    );
}


// ========================================
// PINCH DETECTION
// ========================================

function pinching(hand) {

    if (!hand) {
        return false;
    }

    return (
        distance3D(
            hand[4],
            hand[8]
        ) < 0.055
    );
}


// ========================================
// HAND TO 3D WORLD
// ========================================

function handToWorld(point) {

    return new THREE.Vector3(

        (point.x - 0.5) * 7,

        -(point.y - 0.5) * 5,

        0

    );
}


// ========================================
// FIND CLOSEST OBJECT
// ========================================

function closestObject(position) {

    if (
        !window.JARVIS_SCENE ||
        !JARVIS_SCENE.objects
    ) {
        return null;
    }

    let result = null;
    let smallest = Infinity;

    for (
        const object
        of JARVIS_SCENE.objects
    ) {

        if (!object) {
            continue;
        }

        const distance =
            object.position.distanceTo(
                position
            );

        if (
            distance < smallest
        ) {

            smallest = distance;
            result = object;

        }
    }

    return smallest < 1.5
        ? result
        : null;
}


// ========================================
// START HAND TRACKING
// ========================================

async function startHandTracking() {

    try {

        const video =
            document.getElementById(
                "camera"
            );

        if (!video) {

            console.error(
                "JARVIS: camera element not found."
            );

            return;
        }


        if (
            typeof Hands ===
            "undefined"
        ) {

            console.error(
                "JARVIS: MediaPipe Hands did not load."
            );

            return;
        }


        if (
            typeof Camera ===
            "undefined"
        ) {

            console.error(
                "JARVIS: MediaPipe Camera did not load."
            );

            return;
        }


        JARVIS_HANDS.hands =
            new Hands({

                locateFile:
                    function(file) {

                        return (
                            "https://cdn.jsdelivr.net/npm/@mediapipe/hands/" +
                            file
                        );

                    }

            });


        JARVIS_HANDS.hands.setOptions({

            maxNumHands: 2,

            modelComplexity: 1,

            minDetectionConfidence: 0.65,

            minTrackingConfidence: 0.65

        });


        JARVIS_HANDS.hands.onResults(
            processHands
        );


        JARVIS_HANDS.camera =
            new Camera(
                video,
                {

                    width: 1280,

                    height: 720,

                    onFrame:
                        async function() {

                            await
                            JARVIS_HANDS.hands.send(
                                {
                                    image: video
                                }
                            );

                        }

                }
            );


        JARVIS_HANDS.camera.start();


        console.log(
            "JARVIS: hand tracking started."
        );


    } catch (error) {

        console.error(
            "JARVIS hand tracking error:",
            error
        );

    }
}


// ========================================
// PROCESS HAND RESULTS
// ========================================

function processHands(results) {

    const width =
        window.innerWidth;

    const height =
        window.innerHeight;


    // Clear old tracking
    handCtx.clearRect(
        0,
        0,
        width,
        height
    );


    const hands =
        results.multiHandLandmarks || [];


    JARVIS_HANDS.detected =
        hands.length;


    // Update hand counter
    const handText =
        document.getElementById(
            "handText"
        );

    if (handText) {

        handText.textContent =
            hands.length;

    }


    // Draw every detected hand
    for (
        const hand
        of hands
    ) {

        drawHand(hand);

    }


    // No hands
    if (
        hands.length === 0
    ) {

        if (
            JARVIS_HANDS.grabbing
        ) {

            releaseGrab();

        }


        const reticle =
            document.getElementById(
                "reticle"
            );

        if (reticle) {

            reticle.style.display =
                "none";

        }

        return;
    }


    // First hand
    const hand =
        hands[0];

    const index =
        hand[8];


    const world =
        handToWorld(index);


    // ====================================
    // RETICLE
    // ====================================

    const reticle =
        document.getElementById(
            "reticle"
        );

    if (reticle) {

        reticle.style.display =
            "block";

        reticle.style.left =
            ((1 - index.x) * 100) + "%";

        reticle.style.top =
            (index.y * 100) + "%";

    }


    // ====================================
    // PINCH
    // ====================================

    const pinch =
        pinching(hand);


    // ====================================
    // START GRAB
    // ====================================

    if (
        pinch &&
        !JARVIS_HANDS.grabbing
    ) {

        const object =
            closestObject(world);


        if (object) {

            JARVIS_HANDS.grabbing =
                true;

            JARVIS_HANDS.grabbed =
                object;

            window.JARVIS_GRABBED =
                object;


            // Select object if function exists
            if (
                typeof selectObject ===
                "function"
            ) {

                selectObject(object);

            }


            JARVIS_HANDS.lastPosition =
                world.clone();


            const modeText =
                document.getElementById(
                    "modeText"
                );

            if (modeText) {

                modeText.textContent =
                    "GRAB";

            }

        }

    }


    // ====================================
    // MOVE GRABBED OBJECT
    // ====================================

    if (
        pinch &&
        JARVIS_HANDS.grabbing &&
        JARVIS_HANDS.grabbed
    ) {

        const object =
            JARVIS_HANDS.grabbed;


        object.position.lerp(
            world,
            0.35
        );


        if (
            JARVIS_HANDS.lastPosition
        ) {

            object.userData.velocity =
                new THREE.Vector3()
                    .subVectors(
                        world,
                        JARVIS_HANDS.lastPosition
                    );

        }


        JARVIS_HANDS.lastPosition =
            world.clone();

    }


    // ====================================
    // RELEASE
    // ====================================

    if (
        !pinch &&
        JARVIS_HANDS.grabbing
    ) {

        releaseGrab();

    }


    // ====================================
    // TWO HANDS
    // ====================================

    if (
        hands.length === 2
    ) {

        processTwoHands(
            hands[0],
            hands[1]
        );

    } else {

        JARVIS_HANDS
            .twoHandStartDistance =
            null;

    }
}


// ========================================
// RELEASE OBJECT
// ========================================

function releaseGrab() {

    JARVIS_HANDS.grabbing =
        false;

    JARVIS_HANDS.grabbed =
        null;

    window.JARVIS_GRABBED =
        null;

    JARVIS_HANDS.lastPosition =
        null;


    const modeText =
        document.getElementById(
            "modeText"
        );

    if (modeText) {

        modeText.textContent =
            "IDLE";

    }
}


// ========================================
// TWO-HAND CONTROL
// ========================================

function processTwoHands(
    hand1,
    hand2
) {

    if (
        !window.JARVIS_SCENE
    ) {
        return;
    }


    const object =
        JARVIS_SCENE.selected;


    if (!object) {
        return;
    }


    const p1 =
        hand1[8];

    const p2 =
        hand2[8];


    const distance =
        distance3D(
            p1,
            p2
        );


    const angle =
        Math.atan2(
            p2.y - p1.y,
            p2.x - p1.x
        );


    // First frame of two-hand control
    if (
        JARVIS_HANDS
            .twoHandStartDistance ===
        null
    ) {

        JARVIS_HANDS
            .twoHandStartDistance =
            distance;


        JARVIS_HANDS
            .twoHandStartScale =
            object.scale.x;


        JARVIS_HANDS
            .twoHandStartAngle =
            angle;


        return;
    }


    // ====================================
    // RESIZE
    // ====================================

    const ratio =
        distance /
        JARVIS_HANDS
            .twoHandStartDistance;


    const scale =
        Math.max(
            0.15,
            Math.min(
                5,
                JARVIS_HANDS
                    .twoHandStartScale *
                ratio
            )
        );


    object.scale.setScalar(
        scale
    );


    // ====================================
    // ROTATE
    // ====================================

    const rotation =
        angle -
        JARVIS_HANDS
            .twoHandStartAngle;


    object.rotation.z =
        rotation;


    const modeText =
        document.getElementById(
            "modeText"
        );

    if (modeText) {

        modeText.textContent =
            "TWO HAND";

    }
}


// ========================================
// AUTOMATIC START
// ========================================

window.addEventListener(
    "load",
    function() {

        setTimeout(
            function() {

                startHandTracking();

            },
            500
        );

    }
);
```
