function getProjectData() {

    return {

        version: 1,

        objects:
            JARVIS_SCENE.objects.map(
                object => ({

                    name:
                        object.name,

                    type:
                        object.userData.type,

                    position: {

                        x:
                            object.position.x,

                        y:
                            object.position.y,

                        z:
                            object.position.z

                    },

                    scale:
                        object.scale.x,

                    rotation: {

                        x:
                            object.rotation.x,

                        y:
                            object.rotation.y,

                        z:
                            object.rotation.z

                    }

                })
            ),

        physics:
            JARVIS_SCENE.physics

    };

}


function saveProject() {

    const data =
        getProjectData();


    localStorage.setItem(
        "JARVIS_PROJECT",
        JSON.stringify(data)
    );


    addJarvisLine(
        "JARVIS: Project saved."
    );


    speakJarvis(
        "Project saved."
    );

}


function loadProject() {

    const raw =
        localStorage.getItem(
            "JARVIS_PROJECT"
        );


    if(!raw) {

        addJarvisLine(
            "JARVIS: No saved project found."
        );

        return;

    }


    const data =
        JSON.parse(raw);


    clearScene();


    for(
        const item of
        data.objects || []
    ) {

        const object =
            addObject(
                item.type,
                item.position,
                item.scale,
                item.name
            );


        object.rotation.set(
            item.rotation.x,
            item.rotation.y,
            item.rotation.z
        );

    }


    JARVIS_SCENE.physics =
        Boolean(
            data.physics
        );


    addJarvisLine(
        "JARVIS: Project loaded."
    );

}


function exportProject() {

    const data =
        JSON.stringify(
            getProjectData(),
            null,
            2
        );


    const blob =
        new Blob(
            [data],
            {
                type:
                    "application/json"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        "jarvis-project.json";


    link.click();


    URL.revokeObjectURL(
        url
    );


    addJarvisLine(
        "JARVIS: Project exported."
    );

}
