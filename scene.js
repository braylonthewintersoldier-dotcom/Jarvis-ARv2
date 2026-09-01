const JARVIS_SCENE = {

    scene: new THREE.Scene(),

    camera: null,

    renderer: null,

    objects: [],

    selected: null,

    physics: false,

    gravity: -0.012,

    initialized: false

};


function initScene() {

    JARVIS_SCENE.camera =
        new THREE.PerspectiveCamera(
            55,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );

    JARVIS_SCENE.camera.position.z = 8;


    JARVIS_SCENE.renderer =
        new THREE.WebGLRenderer({
            canvas: document.getElementById("scene"),
            alpha: true,
            antialias: true
        });


    JARVIS_SCENE.renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 2)
    );


    JARVIS_SCENE.renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );


    const ambient =
        new THREE.AmbientLight(
            0xffffff,
            1.2
        );

    JARVIS_SCENE.scene.add(ambient);


    const light =
        new THREE.PointLight(
            0x00ffff,
            5,
            50
        );

    light.position.set(
        0,
        3,
        5
    );

    JARVIS_SCENE.scene.add(light);


    const grid =
        new THREE.GridHelper(
            20,
            20,
            0x00ffff,
            0x003344
        );

    grid.rotation.x =
        Math.PI / 2;

    grid.position.z = -1.5;

    grid.material.transparent = true;

    grid.material.opacity = 0.18;

    JARVIS_SCENE.scene.add(grid);


    JARVIS_SCENE.initialized = true;

    window.addEventListener(
        "resize",
        resizeScene
    );


    animateScene();

}


function material() {

    return new THREE.MeshStandardMaterial({

        color: 0x00d9ff,

        emissive: 0x004c55,

        emissiveIntensity: 1.4,

        transparent: true,

        opacity: 0.88,

        metalness: 0.3,

        roughness: 0.25

    });

}


function createMesh(type) {

    let geometry;


    if(type === "cube") {

        geometry =
            new THREE.BoxGeometry(
                1,
                1,
                1
            );

    }


    if(type === "sphere") {

        geometry =
            new THREE.SphereGeometry(
                0.6,
                32,
                32
            );

    }


    if(type === "cylinder") {

        geometry =
            new THREE.CylinderGeometry(
                0.55,
                0.55,
                1.2,
                32
            );

    }


    if(type === "pyramid") {

        geometry =
            new THREE.ConeGeometry(
                0.7,
                1.2,
                4
            );

    }


    if(type === "torus") {

        geometry =
            new THREE.TorusGeometry(
                0.65,
                0.2,
                20,
                40
            );

    }


    if(!geometry) {

        geometry =
            new THREE.BoxGeometry(
                1,
                1,
                1
            );

    }


    return new THREE.Mesh(
        geometry,
        material()
    );

}


function addObject(
    type,
    position = {
        x: 0,
        y: 0,
        z: 0
    },
    scale = 1,
    name = type
) {

    const mesh =
        createMesh(type);


    mesh.name = name;


    mesh.position.set(
        position.x,
        position.y,
        position.z
    );


    mesh.scale.set(
        scale,
        scale,
        scale
    );


    mesh.userData.type = type;

    mesh.userData.velocity =
        new THREE.Vector3(
            0,
            0,
            0
        );


    mesh.userData.mass = 1;


    JARVIS_SCENE.scene.add(
        mesh
    );


    JARVIS_SCENE.objects.push(
        mesh
    );


    selectObject(mesh);

    updateCounts();


    return mesh;

}


function removeObject(object) {

    if(!object)
        return;


    JARVIS_SCENE.scene.remove(
        object
    );


    JARVIS_SCENE.objects =
        JARVIS_SCENE.objects.filter(
            o => o !== object
        );


    if(
        JARVIS_SCENE.selected === object
    ) {

        JARVIS_SCENE.selected =
            null;

    }


    updateCounts();

}


function selectObject(object) {

    if(
        JARVIS_SCENE.selected
    ) {

        JARVIS_SCENE.selected.material.emissiveIntensity = 1.4;

    }


    JARVIS_SCENE.selected =
        object;


    if(object) {

        object.material.emissiveIntensity = 3;

        document.getElementById(
            "modeText"
        ).textContent =
            "SELECTED";

    }

}


function duplicateObject() {

    const original =
        JARVIS_SCENE.selected;


    if(!original)
        return;


    const clone =
        original.clone();


    clone.material =
        original.material.clone();


    clone.position.x += 1;


    clone.userData =
        structuredClone(
            original.userData
        );


    JARVIS_SCENE.scene.add(
        clone
    );


    JARVIS_SCENE.objects.push(
        clone
    );


    selectObject(clone);

    updateCounts();

}


function clearScene() {

    [...JARVIS_SCENE.objects]
        .forEach(
            removeObject
        );

    JARVIS_SCENE.selected =
        null;

}


function moveSelected(
    x,
    y,
    z
) {

    if(
        !JARVIS_SCENE.selected
    )
        return;


    JARVIS_SCENE.selected.position.set(
        x,
        y,
        z
    );

}


function scaleSelected(
    amount
) {

    if(
        !JARVIS_SCENE.selected
    )
        return;


    JARVIS_SCENE.selected.scale.setScalar(
        amount
    );

}


function rotateSelected(
    x,
    y,
    z
) {

    if(
        !JARVIS_SCENE.selected
    )
        return;


    JARVIS_SCENE.selected.rotation.set(
        x,
        y,
        z
    );

}


function updatePhysics() {

    if(
        !JARVIS_SCENE.physics
    )
        return;


    const objects =
        JARVIS_SCENE.objects;


    for(
        const object of objects
    ) {

        if(
            object === window.JARVIS_GRABBED
        )
            continue;


        object.userData.velocity.y +=
            JARVIS_SCENE.gravity;


        object.position.add(
            object.userData.velocity
        );


        const bottom =
            -2.7;


        if(
            object.position.y < bottom
        ) {

            object.position.y =
                bottom;


            object.userData.velocity.y *=
                -0.45;


            object.userData.velocity.x *=
                0.96;


            object.userData.velocity.z *=
                0.96;

        }

    }


    // basic object collision

    for(
        let i = 0;
        i < objects.length;
        i++
    ) {

        for(
            let j = i + 1;
            j < objects.length;
            j++
        ) {

            const a =
                objects[i];

            const b =
                objects[j];


            const distance =
                a.position.distanceTo(
                    b.position
                );


            const minimum =
                0.65 *
                (
                    a.scale.x +
                    b.scale.x
                );


            if(
                distance > 0 &&
                distance < minimum
            ) {

                const direction =
                    new THREE.Vector3()
                        .subVectors(
                            a.position,
                            b.position
                        )
                        .normalize();


                const push =
                    (
                        minimum -
                        distance
                    ) * 0.5;


                a.position.add(
                    direction.clone()
                        .multiplyScalar(push)
                );


                b.position.add(
                    direction.clone()
                        .multiplyScalar(-push)
                );

            }

        }

    }

}


function animateScene() {

    requestAnimationFrame(
        animateScene
    );


    updatePhysics();


    for(
        const object of
        JARVIS_SCENE.objects
    ) {

        if(
            object !== window.JARVIS_GRABBED
        ) {

            object.rotation.y +=
                0.002;

        }

    }


    JARVIS_SCENE.renderer.render(
        JARVIS_SCENE.scene,
        JARVIS_SCENE.camera
    );

}


function resizeScene() {

    if(
        !JARVIS_SCENE.camera ||
        !JARVIS_SCENE.renderer
    )
        return;


    JARVIS_SCENE.camera.aspect =
        window.innerWidth /
        window.innerHeight;


    JARVIS_SCENE.camera.updateProjectionMatrix();


    JARVIS_SCENE.renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

}


function updateCounts() {

    document.getElementById(
        "objectText"
    ).textContent =
        JARVIS_SCENE.objects.length;

}
