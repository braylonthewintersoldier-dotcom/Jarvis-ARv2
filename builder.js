function executeJarvisCommand(command) {

    if(!command)
        return;


    const action =
        String(
            command.action || ""
        ).toUpperCase();


    switch(action) {


        case "CREATE":

            addObject(

                command.type || "cube",

                command.position || {
                    x: 0,
                    y: 0,
                    z: 0
                },

                command.scale || 1,

                command.name || command.type || "object"

            );

            break;


        case "DELETE":

            removeObject(
                JARVIS_SCENE.selected
            );

            break;


        case "DUPLICATE":

            duplicateObject();

            break;


        case "MOVE":

            if(
                JARVIS_SCENE.selected
            ) {

                const p =
                    command.position || {
                        x: 0,
                        y: 0,
                        z: 0
                    };


                moveSelected(
                    p.x,
                    p.y,
                    p.z
                );

            }

            break;


        case "SCALE":

            scaleSelected(
                Number(
                    command.amount || 1
                )
            );

            break;


        case "ROTATE":

            if(
                JARVIS_SCENE.selected
            ) {

                const r =
                    command.rotation || {
                        x: 0,
                        y: 0,
                        z: 0
                    };


                rotateSelected(
                    r.x,
                    r.y,
                    r.z
                );

            }

            break;


        case "CLEAR":

            clearScene();

            break;


        case "PHYSICS":

            JARVIS_SCENE.physics =
                Boolean(
                    command.enabled
                );


            document.getElementById(
                "modeText"
            ).textContent =
                JARVIS_SCENE.physics
                    ? "PHYSICS"
                    : "IDLE";

            break;


        case "SELECT":

            if(
                JARVIS_SCENE.objects.length
            ) {

                selectObject(
                    JARVIS_SCENE.objects[
                        command.index || 0
                    ]
                );

            }

            break;

    }


    updateCounts();

}


function executeCommandList(
    commands
) {

    if(
        !Array.isArray(commands)
    )
        return;


    for(
        const command of commands
    ) {

        executeJarvisCommand(
            command
        );

    }

}
