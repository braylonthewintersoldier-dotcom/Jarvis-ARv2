const JARVIS_VOICE = {

    recognition: null,

    listening: false

};


function setupVoice() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if(!SpeechRecognition) {

        return;

    }


    JARVIS_VOICE.recognition =
        new SpeechRecognition();


    JARVIS_VOICE.recognition.continuous =
        false;


    JARVIS_VOICE.recognition.interimResults =
        false;


    JARVIS_VOICE.recognition.lang =
        "en-US";


    JARVIS_VOICE.recognition.onstart =
        () => {

            JARVIS_VOICE.listening =
                true;


            document.getElementById(
                "jarvisState"
            ).textContent =
                "LISTENING";

        };


    JARVIS_VOICE.recognition.onend =
        () => {

            JARVIS_VOICE.listening =
                false;


            document.getElementById(
                "jarvisState"
            ).textContent =
                "READY";

        };


    JARVIS_VOICE.recognition.onresult =
        event => {

            const text =
                event.results[
                    event.results.length - 1
                ][0].transcript;


            document.getElementById(
                "chatInput"
            ).value =
                text;


            sendJarvisMessage();

        };


    JARVIS_VOICE.recognition.onerror =
        error => {

            console.error(
                "Speech error:",
                error
            );

        };

}


function startVoice() {

    if(
        !JARVIS_VOICE.recognition
    ) {

        alert(
            "Speech recognition is not supported by this browser."
        );

        return;

    }


    if(
        JARVIS_VOICE.listening
    )
        return;


    JARVIS_VOICE.recognition.start();

}


function speakJarvis(text) {

    if(
        !window.speechSynthesis
    )
        return;


    speechSynthesis.cancel();


    const clean =
        String(text)
            .replace(
                /```[\s\S]*?```/g,
                ""
            );


    const utterance =
        new SpeechSynthesisUtterance(
            clean
        );


    utterance.rate =
        0.95;


    utterance.pitch =
        0.85;


    utterance.volume =
        1;


    speechSynthesis.speak(
        utterance
    );

}
