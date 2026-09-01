// JARVIS APP

const API_BASE = "PASTE_YOUR_RENDER_BACKEND_URL_HERE";

let currentFacing = "user";

document.addEventListener("DOMContentLoaded", async function () {

    console.log("JARVIS: App starting");

    try {

        if (typeof initScene === "function") {
            initScene();
        }

        if (typeof setupVoice === "function") {
            setupVoice();
        }

        setupButtons();

        await startCamera();

        console.log("JARVIS: App ready");

    } catch (error) {

        console.error("JARVIS startup error:", error);

    }

});


// CAMERA

async function startCamera() {

    const video = document.getElementById("camera");

    if (!video) {
        console.error("JARVIS: Camera element not found");
        return;
    }

    if (!navigator.mediaDevices) {
        console.error("JARVIS: Camera API unavailable");
        return;
    }

    try {

        if (video.srcObject) {

            video.srcObject
                .getTracks()
                .forEach(function (track) {
                    track.stop();
                });

        }

        const stream =
            await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: currentFacing,
                    width: {
                        ideal: 1280
                    },
                    height: {
                        ideal: 720
                    }
                },
                audio: false
            });

        video.srcObject = stream;

        video.setAttribute("playsinline", "");
        video.muted = true;

        await video.play();

        const cameraText =
            document.getElementById("cameraText");

        if (cameraText) {
            cameraText.textContent =
                currentFacing === "user"
                    ? "FRONT"
                    : "BACK";
        }

        const systemText =
            document.getElementById("systemText");

        if (systemText) {
            systemText.textContent = "ONLINE";
        }

        console.log("JARVIS: Camera started");

    } catch (error) {

        console.error(
            "JARVIS camera error:",
            error
        );

        const systemText =
            document.getElementById("systemText");

        if (systemText) {
            systemText.textContent = "CAMERA ERROR";
        }

        addJarvisLine(
            "JARVIS: Camera permission is required."
        );

    }

}


// SWITCH CAMERA

async function switchCamera() {

    currentFacing =
        currentFacing === "user"
            ? "environment"
            : "user";

    await startCamera();

}


// BUTTONS

function setupButtons() {

    console.log("JARVIS: Setting up buttons");


    function connect(id, action) {

        const element =
            document.getElementById(id);

        if (!element) {

            console.warn(
                "JARVIS: Missing element:",
                id
            );

            return;
        }

        element.onclick = action;

    }


    connect(
        "cameraBtn",
        switchCamera
    );


    connect(
        "cubeBtn",
        function () {

            if (typeof addObject === "function") {

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


    connect(
        "sphereBtn",
        function () {

            if (typeof addObject === "function") {

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


    connect(
        "cylinderBtn",
        function () {

            if (typeof addObject === "function") {

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


    connect(
        "pyramidBtn",
        function () {

            if (typeof addObject === "function") {

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


    connect(
        "torusBtn",
        function () {

            if (typeof addObject === "function") {

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


    connect(
        "deleteBtn",
        function () {

            if (
                window.JARVIS_SCENE &&
                JARVIS_SCENE.selected &&
                typeof removeObject === "function"
            ) {

                removeObject(
                    JARVIS_SCENE.selected
                );

            }

        }
    );


    connect(
        "duplicateBtn",
        function () {

            if (
                typeof duplicateObject ===
                "function"
            ) {

                duplicateObject();

            }

        }
    );


    connect(
        "physicsBtn",
        function () {

            if (!window.JARVIS_SCENE) {
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

        }
    );


    connect(
        "resetBtn",
        function () {

            if (
                typeof clearScene ===
                "function"
            ) {

                clearScene();

            }

        }
    );


    connect(
        "saveBtn",
        function () {

            if (
                typeof saveProject ===
                "function"
            ) {

                saveProject();

            }

        }
    );


    connect(
        "loadBtn",
        function () {

            if (
                typeof loadProject ===
                "function"
            ) {

                loadProject();

            }

        }
    );


    connect(
        "exportBtn",
        function () {

            if (
                typeof exportProject ===
                "function"
            ) {

                exportProject();

            }

        }
    );


    connect(
        "micBtn",
        function () {

            if (
                typeof startVoice ===
                "function"
            ) {

                startVoice();

            }

        }
    );


    connect(
        "sendBtn",
        sendJarvisMessage
    );


    const chatInput =
        document.getElementById(
            "chatInput"
        );

    if (chatInput) {

        chatInput.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Enter") {

                    event.preventDefault();

                    sendJarvisMessage();

                }

            }
        );

    }


    connect(
        "buildBtn",
        function () {

            addJarvisLine(
                "JARVIS: Build mode active. Tell me what you want to create."
            );

        }
    );


    console.log("JARVIS: Buttons ready");

}


// CHAT

function addJarvisLine(text) {

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
        "jarvisLine";

    div.textContent =
        text;

    output.appendChild(div);

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

    output.appendChild(div);

    output.scrollTop =
        output.scrollHeight;

}


// SEND MESSAGE

async function sendJarvisMessage() {

    const input =
        document.getElementById(
            "chatInput"
        );

    if (!input) {
        return;
    }

    const text =
        input.value.trim();

    if (!text) {
        return;
    }

    input.value = "";

    addUserLine(text);

    const state =
        document.getElementById(
            "jarvisState"
        );

    if (state) {
        state.textContent = "THINKING";
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
                API_BASE +
                "/api/jarvis",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            message: text,

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

    } catch (error) {

        console.error(
            "JARVIS chat error:",
            error
        );

        addJarvisLine(
            "JARVIS: " +
            error.message
        );

    }


    if (state) {
        state.textContent = "READY";
    }

}
