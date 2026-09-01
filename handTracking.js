const JARVIS_HANDS = {

    hands: null,

    camera: null,

    front: true,

    detected: 0,

    grabbing: false,

    grabbed: null,

    lastPosition: null,

    twoHandStartDistance: null,

    twoHandStartScale: 1,

    twoHandStartAngle: null

};


function distance3D(a, b) {

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


function pinching(hand) {

    if(!hand)
        return false;


    return distance3D(
        hand[4],
        hand[8]
    ) < 0.055;

}


function handToWorld(point) {

    return new THREE.Vector3(

        (point.x - 0.5) * 7,

        -(point.y - 0.5) * 5,

        0

    );

}


function closestObject(position) {

    let result = null;

    let smallest =
        Infinity;


    for(
        const object of
        JARVIS_SCENE.objects
    ) {

        const d =
            object.position.distanceTo(
                position
            );


        if(
            d < smallest
        ) {

            smallest = d;

            result = object;

        }

    }


    return smallest < 1.5
        ? result
        : null;

}


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

                        if(
                            JARVIS_HANDS.hands
                        ) {

                            await JARVIS_HANDS.hands.send({
                                image: video
                            });

                        }

                    }

            }
        );


    JARVIS_HANDS.camera.start();

}


function processHands(results) {

    const all =
        results.multiHandLandmarks || [];


    JARVIS_HANDS.detected =
        all.length;


    document.getElementById(
        "handText"
    ).textContent =
        all.length;


    if(all.length === 0) {

        if(
            JARVIS_HANDS.grabbing
        ) {

            releaseGrab();

        }

        return;

    }


    const hand =
        all[0];


    const index =
        hand[8];


    const world =
        handToWorld(index);


    const pinch =
        pinching(hand);


    // RETICLE

    const reticle =
        document.getElementById(
            "reticle"
        );


    reticle.style.display =
        "block";


    reticle.style.left =
        `${index.x * 100}%`;


    reticle.style.top =
        `${index.y * 100}%`;


    // START GRAB

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


            selectObject(object);


            JARVIS_HANDS.lastPosition =
                world.clone();


            document.getElementById(
                "modeText"
            ).textContent =
                "GRABBING";

        }

    }


    // MOVE

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


    // RELEASE

    if(
        !pinch &&
        JARVIS_HANDS.grabbing
    ) {

        releaseGrab();

    }


    // TWO HANDS

    if(
        all.length === 2
    ) {

        processTwoHands(
            all[0],
            all[1]
        );

    }
    else {

        JARVIS_HANDS.twoHandStartDistance =
            null;

    }

}


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
        JARVIS_HANDS.twoHandStartDistance === null
    ) {

        JARVIS_HANDS.twoHandStartDistance =
            d;


        JARVIS_HANDS.twoHandStartScale =
            object.scale.x;


        JARVIS_HANDS.twoHandStartAngle =
            angle;


        return;

    }


    const scaleRatio =
        d /
        JARVIS_HANDS.twoHandStartDistance;


    const newScale =
        Math.max(
            0.15,
            Math.min(
                5,
                JARVIS_HANDS.twoHandStartScale *
                scaleRatio
            )
        );


    object.scale.setScalar(
        newScale
    );


    const rotation =
        angle -
        JARVIS_HANDS.twoHandStartAngle;


    object.rotation.z =
        rotation;


    document.getElementById(
        "modeText"
    ).textContent =
        "TWO-HAND";

}
