```js
// ======================================
// JARVIS HAND TRACKING
// ======================================

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


// ======================================
// CANVAS
// ======================================

const handCanvas =
    document.getElementById(
        "handCanvas"
    );

let handCtx = null;

if (handCanvas) {

    handCtx =
        handCanvas.getContext("2d");

}


function resizeHandCanvas() {

    if (!handCanvas || !handCtx) {
        return;
    }

    const dpr =
        window.devicePixelRatio || 1;


    handCanvas.width =
        window.innerWidth * dpr;

    handCanvas.height =
        window.innerHeight * dpr;


    handCanvas.style.width =
        window.innerWidth + "px";

    handCanvas.style.height =
        window.innerHeight + "px";


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


// ======================================
// HAND CONNECTIONS
// ======================================

const HAND_CONNECTIONS = [

    [0,1],
    [1,2],
    [2,3],
    [3,4],

    [0,5],
    [5,6],
    [6,7],
    [7,8],

    [5,9],
    [9,10],
    [10,11],
    [11,12],

    [9,13],
    [13,14],
    [14,15],
    [15,16],

    [13,17],
    [17,18],
    [18,19],
    [19,20],

    [0,17]

];


// ======================================
// DRAW HAND
// ======================================

function drawHand(
    landmarks
) {

    if (!handCtx) {
        return;
    }


    const width =
        window.innerWidth;

    const height =
        window.innerHeight;


    handCtx.beginPath();


    for (
        const connection
        of HAND_CONNECTIONS
    ) {

        const a =
            landmarks[
                connection[0]
            ];

        const b =
            landmarks[
                connection[1]
            ];


        const ax =
            (1 - a.x) * width;

        const ay =
            a.y * height;


        const bx =
            (1 - b.x) * width;

        const by =
            b.y * height;


        handCtx.moveTo(
            ax,
            ay
        );

        handCtx.lineTo(
            bx,
            by
        );

    }


    handCtx.lineWidth =
        2;

    handCtx.strokeStyle =
        "rgba(0,234,255,0.9)";

    handCtx.stroke();


    for (
        let i = 0;
        i < landmarks.length;
        i++
    ) {

        const point =
            landmarks[i];


        const x =
            (1 - point.x) *
            width;


        const y =
            point.y *
            height;


        const radius =
            i === 4 ||
            i === 8
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
            i === 4 ||
            i === 8
                ? "white"
                : "rgba(0,234,255,0.95)";


        handCtx.fill();

    }


    const index =
        landmarks[8];


    const ix =
        (1 - index.x) *
        width;


    const iy =
        index.y *
        height;


    handCtx.beginPath();


    handCtx.arc(
        ix,
        iy,
        11,
        0,
        Math.PI * 2
    );


    handCtx.lineWidth =
        1;


    handCtx.strokeStyle =
        "rgba(0,234,255,0.9)";


    handCtx.stroke();

}


// ======================================
// DISTANCE
// ======================================

function distance3D(
    a,
    b
) {

    const dx =
        a.x - b.x;

    const dy =
        a.y - b.y;

    const dz =
        (a.z || 0) -
        (b.z || 0);


    return Math.sqrt(
        dx * dx +
        dy * dy +
        dz * dz
    );

}


// ======================================
// PINCH
// ======================================

function pinching(
    hand
) {

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


// ======================================
// HAND → WORLD
// ======================================

function handToWorld(
    point
) {

    return new THREE.Vector3(

        (point.x - 0.5) * 7,

        -(point.y - 0.5) * 5,

        0

    );

}


// ======================================
// FIND OBJECT
// ======================================

function closestObject(
    position
) {

    if (
        !window.JARVIS_SCENE ||
        !JARVIS_SCENE.objects
    ) {

        return null;

    }


    let result =
        null;

    let smallest =
        Infinity;


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
            distance <
            smallest
        ) {

            smallest =
                distance;

            result =
                object;

        }

    }


    if (
        smallest <
        1.5
    ) {

        return result;

    }


    return null;

}


// ======================================
// START HAND TRACKING
// ======================================

async function startHandTracking() {

    console.log(
        "JARVIS: Starting hand tracking..."
    );


    try {

        const video =
            document.getElementById(
                "camera"
            );


        if (!video) {

            console.error(
                "JARVIS: camera element missing"
            );

            return;

        }


        if (
            typeof Hands ===
            "undefined"
        ) {

            console.error(
                "JARVIS: MediaPipe Hands did not load"
            );

            return;

        }


        if (
            typeof Camera ===
            "undefined"
        ) {

            console.error(
                "JARVIS: MediaPipe Camera did not load"
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

            maxNumHands:
                2,

            modelComplexity:
                1,

            minDetectionConfidence:
                0.5,

            minTrackingConfidence:
                0.5

        });


        JARVIS_HANDS.hands.onResults(
            processHands
        );


        JARVIS_HANDS.camera =
            new Camera(

                video,

                {

                    width:
                        1280,

                    height:
                        720,

                    onFrame:
                        async function() {

                            if (
                                video.readyState >= 2
                            ) {

                                await JARVIS_HANDS.hands.send({

                                    image:
                                        video

                                });

                            }

                        }

                }

            );


        JARVIS_HANDS.camera.start();


        console.log(
            "JARVIS: hand tracking started."
        );


        const tracking =
            document.getElementById(
                "trackingText"
            );


        if (tracking) {

            tracking.textContent =
                "ACTIVE";

        }

    }
    catch (error) {

        console.error(
            "JARVIS hand tracking error:",
            error
        );

    }

}


// ======================================
// PROCESS HANDS
// ======================================

function processHands(
    results
) {

    if (
        !handCtx
    ) {

        return;

    }


    const width =
        window.innerWidth;

    const height =
        window.innerHeight;


    handCtx.clearRect(
        0,
        0,
        width,
        height
    );


    const hands =
        results.multiHandLandmarks ||
        [];


    JARVIS_HANDS.detected =
        hands.length;


    const handText =
        document.getElementById(
            "handText"
        );


    if (handText) {

        handText.textContent =
            hands.length;

    }


    for (
        const hand
        of hands
    ) {

        drawHand(
            hand
        );

    }


    if (
        hands.length ===
        0
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


    const hand =
        hands[0];


    const index =
        hand[8];


    const world =
        handToWorld(
            index
        );


    const reticle =
        document.getElementById(
            "reticle"
        );


    if (reticle) {

        reticle.style.display =
            "block";


        reticle.style.left =
            (
                (1 - index.x) *
                100
            ) + "%";


        reticle.style.top =
            (
                index.y *
                100
            ) + "%";

    }


    const pinch =
        pinching(
            hand
        );


    if (
        pinch &&
        !JARVIS_HANDS.grabbing
    ) {

        const object =
            closestObject(
                world
            );


        if (object) {

            JARVIS_HANDS.grabbing =
                true;


            JARVIS_HANDS.grabbed =
                object;


            window.JARVIS_GRABBED =
                object;


            if (
                typeof selectObject ===
                "function"
            ) {

                selectObject(
                    object
                );

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


    if (
        !pinch &&
        JARVIS_HANDS.grabbing
    ) {

        releaseGrab();

    }


    if (
        hands.length ===
        2
    ) {

        processTwoHands(
            hands[0],
            hands[1]
        );

    }
    else {

        JARVIS_HANDS.twoHandStartDistance =
            null;

    }

}


// ======================================
// RELEASE
// ======================================

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


// ======================================
// TWO HAND CONTROL
// ======================================

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


    if (
        JARVIS_HANDS.twoHandStartDistance ===
        null
    ) {

        JARVIS_HANDS.twoHandStartDistance =
            distance;


        JARVIS_HANDS.twoHandStartScale =
            object.scale.x;


        JARVIS_HANDS.twoHandStartAngle =
            angle;


        return;

    }


    const ratio =
        distance /
        JARVIS_HANDS.twoHandStartDistance;


    const scale =
        Math.max(
            0.15,
            Math.min(
                5,
                JARVIS_HANDS.twoHandStartScale *
                ratio
            )
        );


    object.scale.setScalar(
        scale
    );


    const rotation =
        angle -
        JARVIS_HANDS.twoHandStartAngle;


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


// ======================================
// AUTOMATIC START
// ======================================

window.addEventListener(
    "load",
    function() {

        setTimeout(
            function() {

                startHandTracking();

            },
            1000
        );

    }
);
```
