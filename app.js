// ======================================
// JARVIS CONFIG
// ======================================

// AFTER DEPLOYING THE BACKEND,
// PUT YOUR RENDER URL HERE.
//
// Example:
// https://jarvis-ar-backend.onrender.com

const API_BASE =
    "PASTE_YOUR_RENDER_BACKEND_URL_HERE";


// ======================================
// START
// ======================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        initScene();

        setupVoice();

        setupButtons();

        await startCamera();

        await startHandTracking();

    }
);


// ======================================
// CAMERA
// ======================================

let currentFacing =
    "user";


async function startCamera() {

    const video =
        document.getElementById(
            "camera"
        );


    const oldStream =
        video.srcObject;


    if(oldStream) {

        oldStream
            .getTracks()
            .forEach(
                track =>
                    track.stop()
            );

    }


    try {

        const stream =
            await navigator.mediaDevices
                .getUserMedia({

                    video: {

                        facingMode:
                            currentFacing,

                        width: {
                            ideal: 1280
                        },

                        height: {
                            ideal: 720
                        }

                    },

                    audio: false

                });


        video.srcObject =
            stream;


        await video.play();


        document.getElementById(
            "cameraText"
        ).textContent =
            currentFacing === "user"
                ? "FRONT"
                : "BACK";


        document.getElementById(
            "systemText"
        ).textContent =
            "ONLINE";

    }
    catch(error) {

        console.error(
            error
        );


        document.getElementById(
            "systemText"
        ).textContent =
            "CAMERA ERROR";


        addJarvisLine(
            "JARVIS: Camera permission is required."
        );

    }

}


async function switchCamera() {

    currentFacing =
        currentFacing === "user"
            ? "environment"
            : "user";


    await startCamera();

}


// ======================================
// BUTTONS
// ======================================

function setupButtons() {


    document.getElementById(
        "cameraBtn"
    ).onclick =
        switchCamera;


    document.getElementById(
        "cubeBtn"
    ).onclick =
        () =>
            addObject(
                "cube",
                {
                    x: 0,
                    y: 0,
                    z: 0
                },
                1,
                "Cube"
            );


    document.getElementById(
        "sphereBtn"
    ).onclick =
        () =>
            addObject(
                "sphere",
                {
                    x: 0,
                    y: 0,
                    z: 0
                },
                1,
                "Sphere"
            );


    document.getElementById(
        "cylinderBtn"
    ).onclick =
        () =>
            addObject(
                "cylinder",
                {
                    x: 0,
                    y: 0,
                    z: 0
                },
                1,
                "Cylinder"
            );


    document.getElementById(
        "pyramidBtn"
    ).onclick =
        () =>
            addObject(
                "pyramid",
                {
                    x: 0,
                    y: 0,
                    z: 0
                },
                1,
                "Pyramid"
            );


    document.getElementById(
        "torusBtn"
    ).onclick =
        () =>
            addObject(
                "torus",
                {
                    x: 0,
                    y: 0,
                    z: 0
                },
                1,
                "Torus"
            );


    document.getElementById(
        "deleteBtn"
    ).onclick =
        () => {

            removeObject(
                JARVIS_SCENE.selected
            );

        };


    document.getElementById(
        "duplicateBtn"
    ).onclick =
        duplicateObject;


    document.getElementById(
        "physicsBtn"
    ).onclick =
        () => {

            JARVIS_SCENE.physics =
                !JARVIS_SCENE.physics;


            document.getElementById(
                "modeText"
            ).textContent =
                JARVIS_SCENE.physics
                    ? "PHYSICS"
                    : "IDLE";

        };


    document.getElementById(
        "resetBtn"
    ).onclick =
        clearScene;


    document.getElementById(
        "saveBtn"
    ).onclick =
        saveProject;


    document.getElementById(
        "loadBtn"
    ).onclick =
        loadProject;


    document.getElementById(
        "exportBtn"
    ).onclick =
        exportProject;


    document.getElementById(
        "micBtn"
    ).onclick =
        startVoice;


    document.getElementById(
        "sendBtn"
    ).onclick =
        sendJarvisMessage;


    document.getElementById(
        "chatInput"
    ).addEventListener(
        "keydown",
        event => {

            if(
                event.key === "Enter"
            ) {

                sendJarvisMessage();

            }

        }
    );


    document.getElementById(
        "buildBtn"
    ).onclick =
        () => {

            addJarvisLine(
                "JARVIS: Build mode active. Tell me what you want to create."
            );

        };

}


// ======================================
// JARVIS CHAT
// ======================================

function addJarvisLine(text) {

    const output =
        document.getElementById(
            "chatOutput"
        );


    const div =
        document.createElement(
            "div"
        );


    div.className =
        "jarvisLine";


    div.textContent =
        text;


    output.appendChild(
        div
    );


    output.scrollTop =
        output.scrollHeight;

}


function addUserLine(text) {

    const output =
        document.getElementById(
            "chatOutput"
        );


    const div =
        document.createElement(
            "div"
        );


    div.className =
        "jarvisLine userLine";


    div.textContent =
        "YOU: " + text;


    output.appendChild(
        div
    );


    output.scrollTop =
        output.scrollHeight;

}


async function sendJarvisMessage() {

    const input =
        document.getElementById(
            "chatInput"
        );


    const text =
        input.value.trim();


    if(!text)
        return;


    input.value =
        "";


    addUserLine(text);


    document.getElementById(
        "jarvisState"
    ).textContent =
        "THINKING";


    try {

        if(
            API_BASE.includes(
                "PASTE_YOUR"
            )
        ) {

            throw new Error(
                "Backend URL has not been configured."
            );

        }


        const response =
            await fetch(
                `${API_BASE}/api/jarvis`,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            message:
                                text,

                            scene:
                                getProjectData()

                        })

                }
            );


        if(!response.ok) {

            throw new Error(
                "Backend request failed."
            );

        }


        const data =
            await response.json();


        if(
            Array.isArray(
                data.commands
            )
        ) {

            executeCommandList(
                data.commands
            );

        }


        if(data.reply) {

            addJarvisLine(
                "JARVIS: " +
                data.reply
            );


            speakJarvis(
                data.reply
            );

        }

    }
    catch(error) {

        console.error(
            error
        );


        addJarvisLine(
            "JARVIS: " +
            error.message
        );

    }


    document.getElementById(
        "jarvisState"
    ).textContent =
        "READY";

}
