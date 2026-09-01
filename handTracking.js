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


/* =================================
   HAND CANVAS
================================= */

const handCanvas =
    document.getElementById(
        "handCanvas"
    );


const handCtx =
    handCanvas.getContext(
        "2d"
    );


function resizeHandCanvas() {

    handCanvas.width =
        window.innerWidth *
        window.devicePixelRatio;

    handCanvas.height =
        window.innerHeight *
        window.devicePixelRatio;


    handCanvas.style.width =
        window.innerWidth + "px";


    handCanvas.style.height =
        window.innerHeight + "px";


    handCtx.setTransform(
        window.devicePixelRatio,
        0,
        0,
        window.devicePixelRatio,
        0,
        0
    );

}


resizeHandCanvas();


window.addEventListener(
    "resize",
    resizeHandCanvas
);


/* =================================
   HAND DRAWING
================================= */

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


function drawHand(
    landmarks
) {

    const width =
        window.innerWidth;


    const height =
        window.innerHeight;


    handCtx.lineWidth =
        1.5;


    handCtx.lineCap =
        "round";


    /*
       Draw skeleton
    */

    for(
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
            (1 - a.x) *
            width;


        const ay =
            a.y *
            height;


        const bx =
            (1 - b.x) *
            width;


        const by =
            b.y *
            height;


        handCtx.beginPath();

        handCtx.moveTo(
            ax,
            ay
        );

        handCtx.lineTo(
            bx,
            by
        );

        handCtx.stroke();

    }


    /*
       Draw landmarks
    */

    for(
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


        handCtx.beginPath();


        const radius =
            i === 8 ||
            i === 4
                ? 5
                : 2.5;


        handCtx.arc(
            x,
            y,
            radius,
            0,
            Math.PI * 2
        );


        handCtx.fill();

    }


    /*
       Index finger targeting ring
    */

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
        10,
        0,
        Math.PI * 2
    );

    handCtx.stroke();

}


/* =================================
   DISTANCE
================================= */

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


/* =================================
   PINCH
================================= */

function pinching(
    hand
) {

    if(!hand)
        return false;


    return (
        distance3D(
            hand[4],
            hand[8]
        ) < 0.055
    );

}


/* =================================
   WORLD POSITION
================================= */

function handToWorld(
    point
) {

    return new THREE.Vector3(

        (point.x - 0.5) * 7,

        -(point.y - 0.5) * 5,

        0

    );

}


/* =================================
   FIND OBJECT
================================= */

function closestObject(
    position
) {

    let result =
        null;


    let smallest =
        Infinity;


    for(
        const object
        of JARVIS_SCENE.objects
    ) {

        const d =
            object.position.distanceTo(
                position
            );


        if(
            d < smallest
        ) {

            smallest =
                d;


            result =
                object;

        }

    }


    return smallest < 1.5
        ? result
        : null;

}


/* =================================
   START TRACKING
================================= */

async function startHandTracking() {

    const video =
        document.getElementById(
            "camera"
        );


    JARVIS_HANDS.hands =
        new Hands({

            locateFile:
                file =>
                    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`

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
                    async () => {

                        await
                        JARVIS_HANDS.hands
                            .send({
                                image: video
                            });

                    }

            }
        );


    JARVIS_HANDS.camera.start();

}


/* =================================
   PROCESS
================================= */

function processHands(
    results
) {

    /*
       Clear previous hand drawings
    */

    handCtx.clearRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
    );


    const all =
        results.multiHandLandmarks || [];


    JARVIS_HANDS.detected =
        all.length;


    document.getElementById(
        "handText"
    ).textContent =
        all.length;


    /*
       DRAW HANDS
    */

    for(
        const hand
        of all
    ) {

        drawHand(
            hand
        );

    }


    /*
       No hands
    */

    if(
        all.length === 0
    ) {

        if(
            JARVIS_HANDS.grabbing
        ) {

            releaseGrab();

        }


        document.getElementById(
            "reticle"
        ).style.display =
            "none";


        return;

    }


    /*
       First hand
    */

    const hand =
        all[0];


    const index =
        hand[8];


    const world =
        handToWorld(
            index
        );


    /*
       Reticle
    */

    const reticle =
        document.getElementById(
            "reticle"
        );


    reticle.style.display =
        "block";


    reticle.style.left =
        `${(1 - index.x) * 100}%`;


    reticle.style.top =
        `${index.y * 100}%`;


    /*
       Pinch
    */

    const pinch =
        pinching(hand);


    /*
       Start grabbing
    */

    if(
        pinch &&
        !JARVIS_HANDS.grabbing
    ) {

        const object =
            closestObject(
                world
            );


        if(object) {

            JARVIS_HANDS.grabbing =
                true;


            JARVIS_HANDS.grabbed =
                object;


            window.JARVIS_GRABBED =
                object;


            selectObject(
                object
            );


            JARVIS_HANDS.lastPosition =
                world.clone();


            document.getElementById(
                "modeText"
            ).textContent =
                "GRAB";

        }

    }


    /*
       Move grabbed object
    */

    if(
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


        if(
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


    /*
       Release
    */

    if(
        !pinch &&
        JARVIS_HANDS.grabbing
    ) {

        releaseGrab();

    }


    /*
       Two hands
    */

    if(
        all.length === 2
    ) {

        processTwoHands(
            all[0],
            all[1]
        );

    }
    else {

        JARVIS_HANDS
            .twoHandStartDistance =
            null;

    }

}


/* =================================
   RELEASE
================================= */

function releaseGrab() {

    JARVIS_HANDS.grabbing =
        false;


    JARVIS_HANDS.grabbed =
        null;


    window.JARVIS_GRABBED =
        null;


    JARVIS_HANDS.lastPosition =
        null;


    document.getElementById(
        "modeText"
    ).textContent =
        "IDLE";

}


/* =================================
   TWO HANDS
================================= */

function processTwoHands(
    hand1,
    hand2
) {

    const object =
        JARVIS_SCENE.selected;


    if(!object)
        return;


    const p1 =
        hand1[8];


    const p2 =
        hand2[8];


    const d =
        distance3D(
            p1,
            p2
        );


    const angle =
        Math.atan2(
            p2.y - p1.y,
            p2.x - p1.x
        );


    if(
        JARVIS_HANDS
            .twoHandStartDistance === null
    ) {

        JARVIS_HANDS
            .twoHandStartDistance =
            d;


        JARVIS_HANDS
            .twoHandStartScale =
            object.scale.x;


        JARVIS_HANDS
            .twoHandStartAngle =
            angle;


        return;

    }


    /*
       SCALE
    */

    const ratio =
        d /
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


    /*
       ROTATE
    */

    const rotation =
        angle -
        JARVIS_HANDS
            .twoHandStartAngle;


    object.rotation.z =
        rotation;


    document.getElementById(
        "modeText"
    ).textContent =
        "TWO HAND";

}
