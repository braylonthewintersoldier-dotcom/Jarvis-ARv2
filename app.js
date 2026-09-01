```js
// ======================================
// JARVIS CONFIG
// ======================================

// Put your Render backend URL here later.
// Example:
// https://your-backend.onrender.com

const API_BASE =
    "PASTE_YOUR_RENDER_BACKEND_URL_HERE";


// ======================================
// START
// ======================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log("JARVIS: App starting...");

        try {

            if (typeof initScene === "function") {
                initScene();
            }

            if (typeof setupVoice === "function") {
                setupVoice();
            }

            setupButtons();

            await startCamera();

            // handTracking.js also starts itself,
            // so don't start it twice here.

            console.log("JARVIS: App started.");

        }
        catch (error) {

            console.error(
                "JARVIS startup error:",
                error
            );

        }

    }
);


// ======================================
// CAMERA
// ======================================

let currentFacing = "user";


async function startCamera() {

    const video =
        document.getElementById("camera");


    if (!video) {

        console.error(
            "JARVIS: Camera element not found."
        );

        return;

    }


    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {

        console.error(
            "JARVIS: Camera API not available."
        );

        return;

    }


    const oldStream =
        video.srcObject;


    if (oldStream) {

        oldStream
            .getTracks()
            .forEach(
                track => track.stop()
            );

    }


    try {

        const stream =
            await navigator.mediaDevices.getUserMedia({

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


        const cameraText =
            document.getElementById(
                "cameraText"
            );


        if (cameraText) {

            cameraText.textContent =
                currentFacing === "user"
                    ? "FRONT"
                    : "BACK";

        }


        const systemText =
            document.getElementById(
                "systemText"
            );


        if (systemText) {

            systemText.textContent =
                "ONLINE";

        }


        console.log(
            "JARVIS: Camera started."
        );

    }
    catch (error) {

        console.error(
            "JARVIS camera error:",
            error
        );


        const systemText =
            document.getElementById(
                "systemText"
            );


        if (systemText) {

            systemText.textContent =
                "CAMERA ERROR";

        }


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
// SAFE BUTTON SETUP
// ======================================

function setupButtons() {

    console.log(
        "JARVIS: Setting up buttons..."
    );


    function button(id, action) {

        const element =
            document.getElementById(id);


        if (!element) {

            console.warn(
                "JARVIS: Button not found:",
                id
            );

            return;

        }


        element.onclick =
            action;

    }


    // ==================================
    // CAMERA
    // ==================================

    button(
        "cameraBtn",
        switchCamera
    );


    // ==================================
    // CREATE OBJECTS
    // ==================================

    button(
        "cubeBtn",
        () => {

            if (
                typeof addObject ===
                "function"
            ) {

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

            }

        }
    );


    button(
        "sphereBtn",
        () => {

            if (
                typeof addObject ===
                "function"
            ) {

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

            }

        }
    );


    button(
        "cylinderBtn",
        () => {

            if (
                typeof addObject ===
                "function"
            ) {

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

            }

        }
    );


    button(
        "pyramidBtn",
        () => {

            if (
                typeof addObject ===
                "function"
            ) {

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

            }

        }
    );


    button(
        "torusBtn",
        () => {

            if (
                typeof addObject ===
                "function"
            ) {

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

            }

        }
    );


    // ==================================
    // DELETE
    // ==================================

    button(
        "deleteBtn",
        () => {

            if (
                typeof removeObject !==
                "function"
            ) {

                return;

            }


            if (
                window.JARVIS_SCENE &&
                JARVIS_SCENE.selected
            ) {

                removeObject(
                    JARVIS_SCENE.selected
                );

            }

        }
    );


    // ==================================
    // DUPLICATE
    // ==================================

    button(
        "duplicateBtn",
        () => {

            if (
                typeof duplicateObject ===
                "function"
            ) {

                duplicateObject();

            }

        }
    );


    // ==================================
    // PHYSICS
    // ==================================

    button(
        "physicsBtn",
        () => {

            if (
                !window.JARVIS_SCENE
            ) {

                return;

            }


            JARVIS_SCENE.physics =
                !JARVIS_SCENE.physics;


            const modeText =
                document.getElementById(
                    "modeText"
                );


            if (modeText) {

                modeText.textContent =
                    JARVIS_SCENE.physics
                        ? "PHYSICS"
                        : "IDLE";

            }


            console.log(
                "JARVIS physics:",
                JARVIS_SCENE.physics
            );

        }
    );


    // ==================================
    // RESET
    // ==================================

    button(
        "resetBtn",
        () => {

            if (
                typeof clearScene ===
                "function"
            ) {

                clearScene();

            }

        }
    );


    // ==================================
    // SAVE
    // ==================================

    button(
        "saveBtn",
        () => {

            if (
                typeof saveProject ===
                "function"
            ) {

                saveProject();

            }

        }
    );


    // ==================================
    // LOAD
    // ==================================

    button(
        "loadBtn",
        () => {

            if (
                typeof loadProject ===
                "function"
            ) {

                loadProject();

            }

        }
    );


    // ==================================
    // EXPORT
    // ==================================

    button(
        "exportBtn",
        () => {

            if (
                typeof exportProject ===
                "function"
            ) {

                exportProject();

            }

        }
    );


    // ==================================
    // MICROPHONE
    // ==================================

    button(
        "micBtn",
        () => {

            if (
                typeof startVoice ===
                "function"
            ) {

                startVoice();

            }

        }
    );


    // ==================================
    // SEND CHAT
    // ==================================

    button(
        "sendBtn",
        sendJarvisMessage
    );


    // ==================================
    // CHAT INPUT
    // ==================================

    const chatInput =
        document.getElementById(
            "chatInput"
        );


    if (chatInput) {

        chatInput.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    sendJarvisMessage();

                }

            }
        );

    }
    else {

        console.warn(
            "JARVIS: chatInput not found."
        );

    }


    // ==================================
    // BUILD MODE
    // ==================================

    button(
        "buildBtn",
        () => {

            addJarvisLine(
                "JARVIS: Build mode active. Tell me what you want to create."
            );

        }
    );


    console.log(
        "JARVIS: Button setup complete."
    );

}


// ======================================
// JARVIS CHAT
// ======================================

function addJarvisLine(text) {

    const output =
        document.getElementById(
            "chatOutput"
        );


    if (!output) {

        console.warn(
            "JARVIS: chatOutput not found."
        );

        return;

    }


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


    if (!output) {

        return;

    }


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


// ======================================
// SEND JARVIS MESSAGE
// ======================================

async function sendJarvisMessage() {

    const input =
        document.getElementById(
            "chatInput"
        );


    if (!input) {

        console.warn(
            "JARVIS: chatInput not found."
        );

        return;

    }


    const text =
        input.value.trim();


    if (!text) {

        return;

    }


    input.value =
        "";


    addUserLine(
        text
    );


    const jarvisState =
        document.getElementById(
            "jarvisState"
        );


    if (jarvisState) {

        jarvisState.textContent =
            "THINKING";

    }


    try {

        if (
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
                                typeof getProjectData ===
                                "function"
                                    ? getProjectData()
                                    : {}

                        })

                }
            );


        if (!response.ok) {

            throw new Error(
                "Backend request failed."
            );

        }


        const data =
            await response.json();


        if (
            Array.isArray(
                data.commands
            )
        ) {

            if (
                typeof executeCommandList ===
                "function"
            ) {

                executeCommandList(
                    data.commands
                );

            }

        }


        if (data.reply) {

            addJarvisLine(
                "JARVIS: " +
                data.reply
            );


            if (
                typeof speakJarvis ===
                "function"
            ) {

                speakJarvis(
                    data.reply
                );

            }

        }

    }
    catch (error) {

        console.error(
            "JARVIS chat error:",
            error
        );


        addJarvisLine(
            "JARVIS: " +
            error.message
        );

    }


    if (jarvisState) {

        jarvisState.textContent =
            "READY";

    }

}
```
