console.log("JARVIS: New App starting");

/* =========================================================
JARVIS APP
========================================================= */

/*
IMPORTANT:

If your frontend is running from GitHub Pages,
replace this with your Render backend URL.

Example:

const API_BASE = "https://your-app.onrender.com";
*/

const API_BASE =
"PASTE_YOUR_RENDER_BACKEND_URL_HERE";

let currentFacing = "user";

let cameraStarting = false;

/* =========================================================
START APP
========================================================= */

document.addEventListener(
"DOMContentLoaded",
async function () {

```
    console.log(
        "JARVIS: App starting"
    );


    try {

        /*
           Start the Three.js scene FIRST.
        */

        if (
            typeof initScene ===
            "function"
        ) {

            initScene();
        }


        /*
           Start voice system if present.
        */

        if (
            typeof setupVoice ===
            "function"
        ) {

            setupVoice();
        }


        /*
           Connect every button.
        */

        setupButtons();


        /*
           Start camera.
        */

        await startCamera();


        console.log(
            "JARVIS: App ready"
        );

    } catch (error) {

        console.error(
            "JARVIS startup error:",
            error
        );

    }

}
```

);

/* =========================================================
CAMERA
========================================================= */

async function startCamera() {

```
if (cameraStarting) {
    return;
}

cameraStarting = true;


const video =
    document.getElementById(
        "camera"
    );


if (!video) {

    console.error(
        "JARVIS: Camera element not found"
    );

    cameraStarting = false;

    return;
}


if (
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
) {

    console.error(
        "JARVIS: Camera API unavailable"
    );

    cameraStarting = false;

    return;
}


try {

    /*
       Stop old camera stream.
    */

    if (video.srcObject) {

        video.srcObject
            .getTracks()
            .forEach(
                function (track) {
                    track.stop();
                }
            );
    }


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
                    },

                    frameRate: {
                        ideal: 30
                    }

                },

                audio: false
            });


    video.srcObject =
        stream;


    video.setAttribute(
        "playsinline",
        ""
    );

    video.muted = true;


    await video.play();


    /*
       Camera label.
    */

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


    /*
       System status.
    */

    const systemText =
        document.getElementById(
            "systemText"
        );


    if (systemText) {

        systemText.textContent =
            "ONLINE";
    }


    const systemStatus =
        document.getElementById(
            "systemStatus"
        );


    if (systemStatus) {

        systemStatus.textContent =
            "● ONLINE";
    }


    console.log(
        "JARVIS: Camera started"
    );


} catch (error) {

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


    const systemStatus =
        document.getElementById(
            "systemStatus"
        );


    if (systemStatus) {

        systemStatus.textContent =
            "● CAMERA ERROR";
    }


    addJarvisLine(
        "JARVIS: Camera permission is required."
    );


} finally {

    cameraStarting = false;
}
```

}

/* =========================================================
SWITCH CAMERA
========================================================= */

async function switchCamera() {

```
currentFacing =
    currentFacing === "user"
        ? "environment"
        : "user";


await startCamera();
```

}

/* =========================================================
BUTTON SYSTEM
========================================================= */

function setupButtons() {

```
console.log(
    "JARVIS: Setting up buttons"
);


function connect(
    id,
    action
) {

    const element =
        document.getElementById(id);


    if (!element) {

        console.warn(
            "JARVIS: Missing element:",
            id
        );

        return;
    }


    element.onclick =
        action;
}


/* CAMERA */

connect(
    "cameraBtn",
    switchCamera
);


/* CUBE */

connect(
    "cubeBtn",
    function () {

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


/* SPHERE */

connect(
    "sphereBtn",
    function () {

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


/* CYLINDER */

connect(
    "cylinderBtn",
    function () {

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


/* PYRAMID */

connect(
    "pyramidBtn",
    function () {

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


/* TORUS */

connect(
    "torusBtn",
    function () {

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


/* DELETE */

connect(
    "deleteBtn",
    function () {

        if (
            window.JARVIS_SCENE &&
            JARVIS_SCENE.selected &&
            typeof removeObject ===
            "function"
        ) {

            removeObject(
                JARVIS_SCENE.selected
            );
        }

    }
);


/* DUPLICATE */

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


/* PHYSICS */

connect(
    "physicsBtn",
    function () {

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


        addJarvisLine(
            JARVIS_SCENE.physics
                ? "JARVIS: Physics enabled."
                : "JARVIS: Physics disabled."
        );

    }
);


/* CLEAR */

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


/* SAVE */

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


/* LOAD */

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


/* EXPORT */

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


/* MICROPHONE */

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


/* SEND */

connect(
    "sendBtn",
    sendJarvisMessage
);


/* CHAT ENTER */

const chatInput =
    document.getElementById(
        "chatInput"
    );


if (chatInput) {

    chatInput.addEventListener(
        "keydown",
        function (event) {

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


/* BUILD */

connect(
    "buildBtn",
    function () {

        addJarvisLine(
            "JARVIS: Build mode active. Tell me what you want to create."
        );

    }
);


console.log(
    "JARVIS: Buttons ready"
);
```

}

/* =========================================================
JARVIS CHAT
========================================================= */

function addJarvisLine(text) {

```
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
```

}

function addUserLine(text) {

```
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
```

}

/* =========================================================
SEND JARVIS MESSAGE
========================================================= */

async function sendJarvisMessage() {

```
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

    state.textContent =
        "THINKING";
}


try {

    /*
       Check backend.
    */

    if (
        API_BASE.includes(
            "PASTE_YOUR"
        )
    ) {

        throw new Error(
            "Backend URL has not been configured."
        );
    }


    const sceneData =
        typeof getProjectData ===
        "function"
            ? getProjectData()
            : (
                typeof getSceneObjects ===
                "function"
                    ? {
                        objects:
                            getSceneObjects()
                    }
                    : {}
            );


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

                        message:
                            text,

                        scene:
                            sceneData

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


    /*
       Execute commands from JARVIS.
    */

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


    /*
       Show JARVIS response.
    */

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

    state.textContent =
        "READY";
}
```

}

/* =========================================================
GLOBALS
========================================================= */

window.startCamera =
startCamera;

window.switchCamera =
switchCamera;

window.sendJarvisMessage =
sendJarvisMessage;

window.addJarvisLine =
addJarvisLine;

console.log(
"JARVIS: New App loaded"
);
