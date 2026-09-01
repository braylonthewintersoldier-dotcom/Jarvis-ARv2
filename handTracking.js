// JARVIS HAND TRACKING

const JARVIS_HANDS = {
    hands: null,
    camera: null,
    detected: 0,
    grabbing: false,
    grabbed: null,
    lastPosition: null,
    twoHandStartDistance: null,
    twoHandStartScale: null,
    twoHandStartAngle: null
};


// =================================
// START HAND TRACKING
// =================================

async function startHandTracking() {

    console.log("JARVIS: Starting hand tracking");

    const video =
        document.getElementById("camera");

    const canvas =
        document.getElementById("handCanvas");

    if (!video) {
        console.error(
            "JARVIS: Camera video not found"
        );
        return;
    }

    if (!canvas) {
        console.error(
            "JARVIS: Hand canvas not found"
        );
        return;
    }

    if (typeof Hands === "undefined") {
        console.error(
            "JARVIS: MediaPipe Hands not loaded"
        );
        return;
    }

    if (typeof Camera === "undefined") {
        console.error(
            "JARVIS: MediaPipe Camera not loaded"
        );
        return;
    }


    const ctx =
        canvas.getContext("2d");


    canvas.width = 1280;
    canvas.height = 720;


    // Create MediaPipe Hands

    JARVIS_HANDS.hands =
        new Hands({
            locateFile: function (file) {

                return (
                    "https://cdn.jsdelivr.net/npm/" +
                    "@mediapipe/hands/" +
                    file
                );

            }
        });


    JARVIS_HANDS.hands.setOptions({

        maxNumHands: 2,

        modelComplexity: 1,

        minDetectionConfidence: 0.5,

        minTrackingConfidence: 0.5

    });


    JARVIS_HANDS.hands.onResults(
        function (results) {

            processHands(
                results,
                ctx,
                canvas
            );

        }
    );


    // MediaPipe camera

    JARVIS_HANDS.camera =
        new Camera(video, {

            onFrame: async function () {

                if (!video.videoWidth) {
                    return;
                }

                await JARVIS_HANDS.hands.send({
                    image: video
                });

            },

            width: 1280,

            height: 720

        });


    JARVIS_HANDS.camera.start();


    console.log(
        "JARVIS: Hand tracking started"
    );
}


// =================================
// PROCESS HANDS
// =================================

function processHands(
    results,
    ctx,
    canvas
) {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    const landmarks =
        results.multiHandLandmarks || [];


    JARVIS_HANDS.detected =
        landmarks.length;


    // Update hand counter

    const handText =
        document.getElementById(
            "handText"
        );


    if (handText) {

        if (landmarks.length === 0) {

            handText.textContent =
                "NO HAND";

        } else {

            handText.textContent =
                landmarks.length +
                " HAND" +
                (
                    landmarks.length === 1
                        ? ""
                        : "S"
                );

        }

    }


    // Draw every detected hand

    for (
        let i = 0;
        i < landmarks.length;
        i++
    ) {

        drawHand(
            ctx,
            landmarks[i],
            canvas
        );

    }


    // No hands

    if (landmarks.length === 0) {

        JARVIS_HANDS.twoHandStartDistance =
            null;

        JARVIS_HANDS.twoHandStartScale =
            null;

        JARVIS_HANDS.twoHandStartAngle =
            null;


        if (
            JARVIS_HANDS.grabbing
        ) {

            JARVIS_HANDS.grabbing =
                false;

            JARVIS_HANDS.grabbed =
                null;

            JARVIS_HANDS.lastPosition =
                null;

        }

        return;
    }


    const firstHand =
        landmarks[0];


    const indexTip =
        firstHand[8];


    const thumbTip =
        firstHand[4];


    // Draw reticle

    drawReticle(
        ctx,
        indexTip,
        canvas
    );


    // Detect pinch

    const isPinching =
        pinching(
            thumbTip,
            indexTip
        );


    // =================================
    // GRAB
    // =================================

    if (
        isPinching &&
        !JARVIS_HANDS.grabbing
    ) {

        const world =
            handToWorld(
                indexTip,
                canvas
            );


        const object =
            closestObject(
                world
            );


        if (object) {

            JARVIS_HANDS.grabbing =
                true;

            JARVIS_HANDS.grabbed =
                object;

            JARVIS_HANDS.lastPosition =
                world;


            if (
                window.JARVIS_SCENE
            ) {

                JARVIS_SCENE.selected =
                    object;

            }


            console.log(
                "JARVIS: Object grabbed"
            );

        }

    }


    // =================================
    // MOVE
    // =================================

    if (
        isPinching &&
        JARVIS_HANDS.grabbing &&
        JARVIS_HANDS.grabbed
    ) {

        const world =
            handToWorld(
                indexTip,
                canvas
            );


        const object =
            JARVIS_HANDS.grabbed;


        object.position.x =
            world.x;

        object.position.y =
            world.y;

        object.position.z =
            world.z;


        JARVIS_HANDS.lastPosition =
            world;

    }


    // =================================
    // RELEASE
    // =================================

    if (
        !isPinching &&
        JARVIS_HANDS.grabbing
    ) {

        JARVIS_HANDS.grabbing =
            false;

        JARVIS_HANDS.grabbed =
            null;

        JARVIS_HANDS.lastPosition =
            null;


        console.log(
            "JARVIS: Object released"
        );

    }


    // =================================
    // TWO HANDS
    // =================================

    if (
        landmarks.length >= 2
    ) {

        processTwoHands(
            landmarks[0],
            landmarks[1],
            canvas
        );

    } else {

        JARVIS_HANDS.twoHandStartDistance =
            null;

        JARVIS_HANDS.twoHandStartScale =
            null;

        JARVIS_HANDS.twoHandStartAngle =
            null;

    }

}


// =================================
// DRAW HAND
// =================================

function drawHand(
    ctx,
    landmarks,
    canvas
) {

    const connections = [

        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],

        [0, 5],
        [5, 6],
        [6, 7],
        [7, 8],

        [0, 9],
        [9, 10],
        [10, 11],
        [11, 12],

        [0, 13],
        [13, 14],
        [14, 15],
        [15, 16],

        [0, 17],
        [17, 18],
        [18, 19],
        [19, 20],

        [5, 9],
        [9, 13],
        [13, 17]

    ];


    // Lines

    ctx.lineWidth = 3;

    ctx.strokeStyle =
        "#00ffff";


    for (
        const connection
        of connections
    ) {

        const a =
            landmarks[
                connection[0]
            ];

        const b =
            landmarks[
                connection[1]
            ];


        ctx.beginPath();


        /*
         * IMPORTANT:
         *
         * Do NOT flip X here.
         *
         * The camera is intentionally
         * unmirrored.
         */

        ctx.moveTo(
            a.x * canvas.width,
            a.y * canvas.height
        );


        ctx.lineTo(
            b.x * canvas.width,
            b.y * canvas.height
        );


        ctx.stroke();

    }


    // Points

    for (
        const point
        of landmarks
    ) {

        ctx.beginPath();


        ctx.arc(
            point.x * canvas.width,
            point.y * canvas.height,
            5,
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            "#00ffff";


        ctx.fill();

    }

}


// =================================
// RETICLE
// =================================

function drawReticle(
    ctx,
    point,
    canvas
) {

    const x =
        point.x *
        canvas.width;


    const y =
        point.y *
        canvas.height;


    ctx.beginPath();


    ctx.arc(
        x,
        y,
        15,
        0,
        Math.PI * 2
    );


    ctx.strokeStyle =
        "#ffffff";


    ctx.lineWidth = 2;


    ctx.stroke();

}


// =================================
// DISTANCE
// =================================

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


// =================================
// PINCH
// =================================

function pinching(
    thumb,
    index
) {

    return (
        distance3D(
            thumb,
            index
        ) < 0.055
    );

}


// =================================
// HAND TO WORLD
// =================================

function handToWorld(
    point,
    canvas
) {

    /*
     * Normal orientation.
     *
     * X is NOT reversed.
     */

    const x =
        (point.x - 0.5) * 8;


    const y =
        -(point.y - 0.5) * 5;


    const z =
        -point.z * 4;


    return {

        x: x,

        y: y,

        z: z

    };

}


// =================================
// FIND CLOSEST OBJECT
// =================================

function closestObject(
    position
) {

    if (
        !window.JARVIS_SCENE
    ) {

        return null;

    }


    if (
        !Array.isArray(
            JARVIS_SCENE.objects
        )
    ) {

        return null;

    }


    let closest =
        null;


    let closestDistance =
        Infinity;


    for (
        const object
        of JARVIS_SCENE.objects
    ) {

        if (!object) {
            continue;
        }


        if (!object.position) {
            continue;
        }


        const dx =
            object.position.x -
            position.x;


        const dy =
            object.position.y -
            position.y;


        const dz =
            object.position.z -
            position.z;


        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy +
                dz * dz
            );


        if (
            distance <
                closestDistance &&
            distance < 1.5
        ) {

            closestDistance =
                distance;

            closest =
                object;

        }

    }


    return closest;

}


// =================================
// TWO HAND CONTROL
// =================================

function processTwoHands(
    hand1,
    hand2,
    canvas
) {

    if (
        !window.JARVIS_SCENE
    ) {

        return;

    }


    if (
        !JARVIS_SCENE.selected
    ) {

        return;

    }


    const object =
        JARVIS_SCENE.selected;


    const p1 =
        hand1[8];


    const p2 =
        hand2[8];


    const dx =
        p1.x - p2.x;


    const dy =
        p1.y - p2.y;


    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        );


    const angle =
        Math.atan2(
            dy,
            dx
        );


    // Start two-hand gesture

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


    // Resize

    const scaleRatio =
        distance /
        JARVIS_HANDS
            .twoHandStartDistance;


    let newScale =
        JARVIS_HANDS
            .twoHandStartScale *
        scaleRatio;


    // Prevent disappearing

    newScale =
        Math.max(
            0.1,
            Math.min(
                newScale,
                10
            )
        );


    object.scale.set(
        newScale,
        newScale,
        newScale
    );


    // Rotate

    const rotationDifference =
        angle -
        JARVIS_HANDS
            .twoHandStartAngle;


    object.rotation.y =
        rotationDifference;

}


// =================================
// AUTO START
// =================================

window.addEventListener(
    "load",
    function () {

        setTimeout(
            function () {

                startHandTracking();

            },
            1500
        );

    }
);
