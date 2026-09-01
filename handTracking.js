console.log("JARVIS: Starting hand tracking");

let video = null;
let handCanvas = null;
let handCtx = null;
let hands = null;
let cameraFeed = null;

let latestHands = [];

function startHandTracking() {
    video = document.getElementById("camera");
    handCanvas = document.getElementById("handCanvas");

    if (!video || !handCanvas) {
        console.error("JARVIS: Camera or hand canvas missing");
        return;
    }

    handCtx = handCanvas.getContext("2d");

    hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });

    hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.65,
        minTrackingConfidence: 0.65
    });

    hands.onResults(onHandResults);

    cameraFeed = new Camera(video, {
        onFrame: async () => {
            await hands.send({
                image: video
            });
        },
        width: 1280,
        height: 720
    });

    cameraFeed.start();

    console.log("JARVIS: Hand tracking started");
}

function resizeCanvas() {
    if (!handCanvas || !video) return;

    handCanvas.width = video.videoWidth || 1280;
    handCanvas.height = video.videoHeight || 720;
}

function onHandResults(results) {
    if (!handCtx || !handCanvas) return;

    resizeCanvas();

    handCtx.clearRect(
        0,
        0,
        handCanvas.width,
        handCanvas.height
    );

    latestHands = results.multiHandLandmarks || [];

    if (!results.multiHandLandmarks) return;

    for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const landmarks = results.multiHandLandmarks[i];

        drawHand(landmarks);

        drawReticle(landmarks[8]);
    }
}

function drawHand(landmarks) {
    handCtx.lineWidth = 3;
    handCtx.strokeStyle = "#00ffff";
    handCtx.fillStyle = "#00ffff";

    const connections = [
        [0,1],[1,2],[2,3],[3,4],
        [0,5],[5,6],[6,7],[7,8],
        [0,9],[9,10],[10,11],[11,12],
        [0,13],[13,14],[14,15],[15,16],
        [0,17],[17,18],[18,19],[19,20],
        [5,9],[9,13],[13,17]
    ];

    for (const connection of connections) {
        const a = landmarks[connection[0]];
        const b = landmarks[connection[1]];

        const ax = a.x * handCanvas.width;
        const ay = a.y * handCanvas.height;

        const bx = b.x * handCanvas.width;
        const by = b.y * handCanvas.height;

        handCtx.beginPath();
        handCtx.moveTo(ax, ay);
        handCtx.lineTo(bx, by);
        handCtx.stroke();
    }

    for (const point of landmarks) {
        const x = point.x * handCanvas.width;
        const y = point.y * handCanvas.height;

        handCtx.beginPath();
        handCtx.arc(x, y, 4, 0, Math.PI * 2);
        handCtx.fill();
    }
}

function drawReticle(point) {
    if (!point) return;

    const x = point.x * handCanvas.width;
    const y = point.y * handCanvas.height;

    handCtx.beginPath();
    handCtx.arc(x, y, 10, 0, Math.PI * 2);
    handCtx.strokeStyle = "#00ffff";
    handCtx.lineWidth = 2;
    handCtx.stroke();
}

function getHandLandmarks() {
    return latestHands;
}

function handToWorld(point) {
    if (!point) return null;

    const x = (point.x - 0.5) * 8;
    const y = -(point.y - 0.5) * 4.5;

    return {
        x: x,
        y: y,
        z: -point.z * 4
    };
}

window.startHandTracking = startHandTracking;
window.getHandLandmarks = getHandLandmarks;
window.handToWorld = handToWorld;

window.addEventListener("load", () => {
    startHandTracking();
});
