// ==========================================
// PROXISPEAK OFFICE JAVASCRIPT
// ==========================================


// ==========================================
// SOCKET.IO CONNECTION
// ==========================================

const socket = io("http://localhost:5000");


// ==========================================
// HTML ELEMENTS
// ==========================================

const officeArea =
    document.getElementById("officeArea");

const currentUsername =
    document.getElementById("currentUsername");

const logoutButton =
    document.getElementById("logoutButton");

const micButton =
    document.getElementById("micButton");

const audioButton =
    document.getElementById("audioButton");

const onlineCount =
    document.getElementById("onlineCount");


// ==========================================
// USERNAME
// ==========================================

const username =
    localStorage.getItem("proxiSpeakUser");


// ==========================================
// LOGIN CHECK
// ==========================================

if (!username) {

    window.location.href = "index.html";

}


// ==========================================
// SHOW USERNAME
// ==========================================

currentUsername.textContent =
    username;


// ==========================================
// MY POSITION
// ==========================================

let myX = 400;

let myY = 250;


// Movement speed

const speed = 10;


// Keyboard keys

const keys = {};


// Current avatar

let myAvatar = null;


// ==========================================
// OTHER USERS
// ==========================================

const otherUsers = {};

const otherUserPositions = {};


// ==========================================
// SPEAKING USERS
// ==========================================

const speakingUsers = {};


// ==========================================
// PROXIMITY
// ==========================================

const MAX_AUDIO_DISTANCE = 300;

const NEARBY_DISTANCE = 120;

const CLOSER_DISTANCE = 300;


// ==========================================
// WEBRTC
// ==========================================

const peerConnections = {};

let localStream = null;

const remoteAudios = {};


// ==========================================
// AUDIO STATES
// ==========================================

let micOn = true;

let audioOn = true;


// ==========================================
// SPEAKING DETECTION
// ==========================================

let audioContext = null;

let analyser = null;

let microphoneSource = null;

let audioData = null;

let lastSpeakingState = false;


// ==========================================
// WEBRTC CONFIG
// ==========================================

const rtcConfig = {

    iceServers: [

        {
            urls:
                "stun:stun.l.google.com:19302"
        }

    ]

};


// ==========================================
// COLLISION OBJECTS
// ==========================================

const collisionSelectors = [

    ".developer-zone",
    ".team-zone",
    ".meeting-room",
    ".coffee-area",
    ".whiteboard",
    ".plant",
    ".office-entrance"

];


// ==========================================
// GET COLLISION OBJECTS
// ==========================================

function getCollisionObjects() {

    return collisionSelectors.map(
        function (selector) {

            return document.querySelector(
                selector
            );

        }
    ).filter(
        function (element) {

            return element !== null;

        }
    );

}


// ==========================================
// CHECK COLLISION
// ==========================================

function checkCollision(
    newX,
    newY
) {

    if (!myAvatar) {

        return false;

    }


    const avatarWidth =
        myAvatar.offsetWidth;

    const avatarHeight =
        myAvatar.offsetHeight;


    const avatarRect = {

        left:
            newX,

        right:
            newX +
            avatarWidth,

        top:
            newY,

        bottom:
            newY +
            avatarHeight

    };


    const objects =
        getCollisionObjects();


    for (
        let i = 0;
        i < objects.length;
        i++
    ) {

        const object =
            objects[i];


        const objectLeft =
            object.offsetLeft;


        const objectTop =
            object.offsetTop;


        const objectRight =
            objectLeft +
            object.offsetWidth;


        const objectBottom =
            objectTop +
            object.offsetHeight;


        const collision =
            avatarRect.right >
            objectLeft &&

            avatarRect.left <
            objectRight &&

            avatarRect.bottom >
            objectTop &&

            avatarRect.top <
            objectBottom;


        if (collision) {

            return true;

        }

    }


    return false;

}


// ==========================================
// SOCKET CONNECT
// ==========================================

socket.on(
    "connect",
    async function () {

        console.log(
            "Connected to ProxiSpeak server"
        );


        // Join office

        socket.emit(
            "joinOffice",
            {
                username: username
            }
        );


        // Create own avatar

        createMyAvatar();


        // Start microphone

        await startMicrophone();

    }
);


// ==========================================
// CREATE MY AVATAR
// ==========================================

function createMyAvatar() {

    if (myAvatar) {

        return;

    }


    myAvatar =
        document.createElement("div");


    myAvatar.className =
        "avatar current-user";


    // Employee icon

    const employeeIcon =
        document.createElement("div");


    employeeIcon.className =
        "employee-icon";


    employeeIcon.textContent =
        "👩‍💻";


    // Name tag

    const nameTag =
        document.createElement("div");


    nameTag.className =
        "name-tag";


    nameTag.textContent =
        username;


    // Add elements

    myAvatar.appendChild(
        employeeIcon
    );


    myAvatar.appendChild(
        nameTag
    );


    // Position

    myAvatar.style.left =
        myX + "px";


    myAvatar.style.top =
        myY + "px";


    // Add to office

    officeArea.appendChild(
        myAvatar
    );


    console.log(
        "My employee avatar created:",
        username
    );

}


// ==========================================
// CREATE OTHER USER
// ==========================================

function createOtherUser(user) {

    if (
        otherUsers[
            user.socketId
        ]
    ) {

        return;

    }


    const avatar =
        document.createElement("div");


    avatar.className =
        "avatar";


    // Employee icon

    const employeeIcon =
        document.createElement("div");


    employeeIcon.className =
        "employee-icon";


    employeeIcon.textContent =
        "👨‍💻";


    // Name tag

    const nameTag =
        document.createElement("div");


    nameTag.className =
        "name-tag";


    nameTag.textContent =
        user.username;


    // Add elements

    avatar.appendChild(
        employeeIcon
    );


    avatar.appendChild(
        nameTag
    );


    // Position

    avatar.style.left =
        user.x + "px";


    avatar.style.top =
        user.y + "px";


    // Add to office

    officeArea.appendChild(
        avatar
    );


    // Store avatar

    otherUsers[
        user.socketId
    ] =
        avatar;


    // Store position

    otherUserPositions[
        user.socketId
    ] = {

        x: user.x,

        y: user.y

    };


    updateOnlineCount();

    updateUserProximityStatus(
        user.socketId
    );

    updateProximityAudio();


    console.log(
        "Employee joined:",
        user.username
    );

}


// ==========================================
// ONLINE COUNT
// ==========================================

function updateOnlineCount() {

    const count =
        1 +
        Object.keys(
            otherUsers
        ).length;


    onlineCount.textContent =
        count;

}


// ==========================================
// EXISTING USERS
// ==========================================

socket.on(
    "existingUsers",
    function (users) {

        console.log(
            "Existing users:",
            users
        );


        users.forEach(
            function (user) {

                createOtherUser(
                    user
                );

            }
        );


        updateOnlineCount();

    }
);


// ==========================================
// NEW USER JOINED
// ==========================================

socket.on(
    "userJoined",
    async function (user) {

        console.log(
            "New employee joined:",
            user
        );


        createOtherUser(
            user
        );


        updateOnlineCount();


        await createOffer(
            user.socketId
        );

    }
);


// ==========================================
// MICROPHONE
// ==========================================

async function startMicrophone() {

    try {

        localStream =
            await navigator.mediaDevices.getUserMedia({

                audio: true,

                video: false

            });


        console.log(
            "Microphone permission granted"
        );


        startSpeakingDetection();

    }

    catch (error) {

        console.error(
            "Microphone permission error:",
            error
        );

    }

}


// ==========================================
// SPEAKING DETECTION
// ==========================================

function startSpeakingDetection() {

    if (!localStream) {

        return;

    }


    try {

        audioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();


        analyser =
            audioContext.createAnalyser();


        analyser.fftSize =
            256;


        microphoneSource =
            audioContext.createMediaStreamSource(
                localStream
            );


        microphoneSource.connect(
            analyser
        );


        audioData =
            new Uint8Array(
                analyser.frequencyBinCount
            );


        checkSpeaking();

    }

    catch (error) {

        console.error(
            "Speaking detection error:",
            error
        );

    }

}


// ==========================================
// CHECK SPEAKING
// ==========================================

function checkSpeaking() {

    if (
        !analyser ||
        !audioData
    ) {

        return;

    }


    analyser.getByteFrequencyData(
        audioData
    );


    let total = 0;


    for (
        let i = 0;
        i < audioData.length;
        i++
    ) {

        total += audioData[i];

    }


    const average =
        total /
        audioData.length;


    const SPEAKING_THRESHOLD = 25;


    let isSpeaking = false;


    if (
        micOn &&
        average > SPEAKING_THRESHOLD
    ) {

        isSpeaking = true;

    }


    if (
        isSpeaking !==
        lastSpeakingState
    ) {

        lastSpeakingState =
            isSpeaking;


        setSpeaking(
            isSpeaking
        );


        if (socket.connected) {

            socket.emit(
                "speaking",
                isSpeaking
            );

        }

    }


    requestAnimationFrame(
        checkSpeaking
    );

}


// ==========================================
// MY SPEAKING INDICATOR
// ==========================================

function setSpeaking(isSpeaking) {

    if (!myAvatar) {

        return;

    }


    if (isSpeaking) {

        myAvatar.classList.add(
            "speaking"
        );

    }

    else {

        myAvatar.classList.remove(
            "speaking"
        );

    }

}


// ==========================================
// REMOTE SPEAKING
// ==========================================

socket.on(
    "userSpeaking",
    function (data) {

        speakingUsers[
            data.socketId
        ] =
            data.speaking;


        updateSpeakingIndicator(
            data.socketId
        );

    }
);


// ==========================================
// UPDATE SPEAKING INDICATOR
// ==========================================

function updateSpeakingIndicator(socketId) {

    const avatar =
        otherUsers[
            socketId
        ];


    if (!avatar) {

        return;

    }


    const isSpeaking =
        speakingUsers[
            socketId
        ];


    let status =
        avatar.querySelector(
            ".speaking-status"
        );


    if (isSpeaking) {

        avatar.classList.add(
            "speaking"
        );


        if (!status) {

            status =
                document.createElement(
                    "div"
                );


            status.className =
                "speaking-status";


            status.textContent =
                "🎤 Speaking...";


            avatar.appendChild(
                status
            );

        }

    }

    else {

        avatar.classList.remove(
            "speaking"
        );


        if (status) {

            status.remove();

        }

    }

}


// ==========================================
// CALCULATE DISTANCE
// ==========================================

function getDistance(socketId) {

    const position =
        otherUserPositions[
            socketId
        ];


    if (!position) {

        return Infinity;

    }


    const dx =
        myX -
        position.x;


    const dy =
        myY -
        position.y;


    return Math.sqrt(
        dx * dx +
        dy * dy
    );

}


// ==========================================
// PROXIMITY STATUS
// ==========================================

function updateUserProximityStatus(socketId) {

    const avatar =
        otherUsers[
            socketId
        ];


    if (!avatar) {

        return;

    }


    const distance =
        getDistance(
            socketId
        );


    let status =
        avatar.querySelector(
            ".proximity-status"
        );


    if (!status) {

        status =
            document.createElement(
                "div"
            );


        status.className =
            "proximity-status";


        avatar.appendChild(
            status
        );

    }


    status.classList.remove(
        "nearby",
        "closer",
        "far"
    );


    if (
        distance <=
        NEARBY_DISTANCE
    ) {

        status.textContent =
            "🟢 Nearby";


        status.classList.add(
            "nearby"
        );

    }

    else if (
        distance <=
        CLOSER_DISTANCE
    ) {

        status.textContent =
            "🟡 Getting Closer";


        status.classList.add(
            "closer"
        );

    }

    else {

        status.textContent =
            "⚪ Far Away";


        status.classList.add(
            "far"
        );

    }

}


// ==========================================
// UPDATE ALL PROXIMITY
// ==========================================

function updateAllProximityStatuses() {

    Object.keys(
        otherUsers
    ).forEach(
        function (socketId) {

            updateUserProximityStatus(
                socketId
            );

        }
    );

}


// ==========================================
// USER MOVED
// ==========================================

socket.on(
    "userMoved",
    function (data) {

        const avatar =
            otherUsers[
                data.socketId
            ];


        if (!avatar) {

            return;

        }


        avatar.style.left =
            data.x + "px";


        avatar.style.top =
            data.y + "px";


        otherUserPositions[
            data.socketId
        ] = {

            x: data.x,

            y: data.y

        };


        updateUserProximityStatus(
            data.socketId
        );


        updateProximityAudio();

    }
);


// ==========================================
// USER LEFT
// ==========================================

socket.on(
    "userLeft",
    function (socketId) {

        const avatar =
            otherUsers[
                socketId
            ];


        if (avatar) {

            avatar.remove();

        }


        delete otherUsers[
            socketId
        ];


        delete otherUserPositions[
            socketId
        ];


        delete speakingUsers[
            socketId
        ];


        if (
            peerConnections[
                socketId
            ]
        ) {

            peerConnections[
                socketId
            ].close();


            delete peerConnections[
                socketId
            ];

        }


        if (
            remoteAudios[
                socketId
            ]
        ) {

            remoteAudios[
                socketId
            ].remove();


            delete remoteAudios[
                socketId
            ];

        }


        updateOnlineCount();

    }
);


// ==========================================
// PROXIMITY AUDIO
// ==========================================

function updateProximityAudio() {

    Object.keys(
        remoteAudios
    ).forEach(
        function (socketId) {

            const audio =
                remoteAudios[
                    socketId
                ];


            const position =
                otherUserPositions[
                    socketId
                ];


            if (
                !audio ||
                !position
            ) {

                return;

            }


            const distance =
                getDistance(
                    socketId
                );


            let volume =
                1 -
                (
                    distance /
                    MAX_AUDIO_DISTANCE
                );


            volume =
                Math.max(
                    0,
                    Math.min(
                        1,
                        volume
                    )
                );


            if (!audioOn) {

                audio.volume = 0;

            }

            else {

                audio.volume =
                    volume;

            }

        }
    );

}


// ==========================================
// CREATE PEER CONNECTION
// ==========================================

function createPeerConnection(targetSocketId) {

    if (
        peerConnections[
            targetSocketId
        ]
    ) {

        return peerConnections[
            targetSocketId
        ];

    }


    const peerConnection =
        new RTCPeerConnection(
            rtcConfig
        );


    peerConnections[
        targetSocketId
    ] =
        peerConnection;


    // ADD LOCAL AUDIO

    if (localStream) {

        localStream
            .getTracks()
            .forEach(
                function (track) {

                    peerConnection.addTrack(
                        track,
                        localStream
                    );

                }
            );

    }


    // ======================================
    // ICE CANDIDATE
    // ======================================

    peerConnection.onicecandidate =
        function (event) {

            if (event.candidate) {

                socket.emit(
                    "iceCandidate",
                    {

                        target:
                            targetSocketId,

                        candidate:
                            event.candidate

                    }
                );

            }

        };


    // ======================================
    // REMOTE AUDIO
    // ======================================

    peerConnection.ontrack =
        function (event) {

            console.log(
                "Remote audio received from:",
                targetSocketId
            );


            let audio =
                remoteAudios[
                    targetSocketId
                ];


            if (!audio) {

                audio =
                    document.createElement(
                        "audio"
                    );


                audio.autoplay =
                    true;


                audio.playsInline =
                    true;


                document.body.appendChild(
                    audio
                );


                remoteAudios[
                    targetSocketId
                ] =
                    audio;

            }


            audio.srcObject =
                event.streams[0];


            audio.muted =
                !audioOn;


            audio.volume =
                1;


            updateProximityAudio();


            audio.play()
                .then(
                    function () {

                        console.log(
                            "Remote audio playing"
                        );

                    }
                )
                .catch(
                    function (error) {

                        console.log(
                            "Audio waiting for interaction:",
                            error
                        );

                    }
                );

        };


    return peerConnection;

}


// ==========================================
// CREATE WEBRTC OFFER
// ==========================================

async function createOffer(targetSocketId) {

    try {

        if (!localStream) {

            console.log(
                "Microphone is not ready yet."
            );

            return;

        }


        const peerConnection =
            createPeerConnection(
                targetSocketId
            );


        const offer =
            await peerConnection.createOffer();


        await peerConnection.setLocalDescription(
            offer
        );


        socket.emit(
            "webrtcOffer",
            {

                target:
                    targetSocketId,

                offer:
                    offer

            }
        );

    }

    catch (error) {

        console.error(
            "Offer error:",
            error
        );

    }

}


// ==========================================
// RECEIVE OFFER
// ==========================================

socket.on(
    "webrtcOffer",
    async function (data) {

        try {

            const peerConnection =
                createPeerConnection(
                    data.sender
                );


            await peerConnection.setRemoteDescription(
                new RTCSessionDescription(
                    data.offer
                )
            );


            const answer =
                await peerConnection.createAnswer();


            await peerConnection.setLocalDescription(
                answer
            );


            socket.emit(
                "webrtcAnswer",
                {

                    target:
                        data.sender,

                    answer:
                        answer

                }
            );

        }

        catch (error) {

            console.error(
                "Offer handling error:",
                error
            );

        }

    }
);


// ==========================================
// RECEIVE ANSWER
// ==========================================

socket.on(
    "webrtcAnswer",
    async function (data) {

        try {

            const peerConnection =
                peerConnections[
                    data.sender
                ];


            if (!peerConnection) {

                return;

            }


            await peerConnection.setRemoteDescription(
                new RTCSessionDescription(
                    data.answer
                )
            );

        }

        catch (error) {

            console.error(
                "Answer handling error:",
                error
            );

        }

    }
);


// ==========================================
// RECEIVE ICE CANDIDATE
// ==========================================

socket.on(
    "iceCandidate",
    async function (data) {

        try {

            const peerConnection =
                peerConnections[
                    data.sender
                ];


            if (!peerConnection) {

                return;

            }


            await peerConnection.addIceCandidate(
                new RTCIceCandidate(
                    data.candidate
                )
            );

        }

        catch (error) {

            console.error(
                "ICE candidate error:",
                error
            );

        }

    }
);


// ==========================================
// KEY DOWN
// ==========================================

document.addEventListener(
    "keydown",
    function (event) {

        const key =
            event.key.toLowerCase();


        if (
            [
                "w",
                "a",
                "s",
                "d",
                "arrowup",
                "arrowdown",
                "arrowleft",
                "arrowright"
            ].includes(key)
        ) {

            event.preventDefault();

        }


        keys[key] = true;

    }
);


// ==========================================
// KEY UP
// ==========================================

document.addEventListener(
    "keyup",
    function (event) {

        const key =
            event.key.toLowerCase();


        keys[key] = false;

    }
);


// ==========================================
// MOVE USER
// ==========================================

function moveUser() {

    let newX =
        myX;

    let newY =
        myY;


    let moved = false;


    // ======================================
    // CALCULATE NEW POSITION
    // ======================================

    if (
        keys["w"] ||
        keys["arrowup"]
    ) {

        newY -= speed;

        moved = true;

    }


    if (
        keys["s"] ||
        keys["arrowdown"]
    ) {

        newY += speed;

        moved = true;

    }


    if (
        keys["a"] ||
        keys["arrowleft"]
    ) {

        newX -= speed;

        moved = true;

    }


    if (
        keys["d"] ||
        keys["arrowright"]
    ) {

        newX += speed;

        moved = true;

    }


    // ======================================
    // OFFICE BOUNDARY
    // ======================================

    const avatarWidth =
        myAvatar
            ? myAvatar.offsetWidth
            : 76;


    const avatarHeight =
        myAvatar
            ? myAvatar.offsetHeight
            : 62;


    newX =
        Math.max(
            0,
            Math.min(
                newX,
                officeArea.clientWidth -
                avatarWidth
            )
        );


    newY =
        Math.max(
            0,
            Math.min(
                newY,
                officeArea.clientHeight -
                avatarHeight
            )
        );


    // ======================================
    // COLLISION CHECK
    // ======================================

    if (
        moved &&
        !checkCollision(
            newX,
            newY
        )
    ) {

        myX =
            newX;

        myY =
            newY;

    }


    // ======================================
    // UPDATE AVATAR
    // ======================================

    if (myAvatar) {

        myAvatar.style.left =
            myX + "px";


        myAvatar.style.top =
            myY + "px";

    }


    // ======================================
    // SEND POSITION
    // ======================================

    if (
        moved &&
        socket.connected
    ) {

        socket.emit(
            "updatePosition",
            {

                x:
                    myX,

                y:
                    myY

            }
        );

    }


    // ======================================
    // UPDATE PROXIMITY
    // ======================================

    updateProximityAudio();

    updateAllProximityStatuses();


    // Continue movement

    requestAnimationFrame(
        moveUser
    );

}


// ==========================================
// START MOVEMENT LOOP
// ==========================================

moveUser();


// ==========================================
// MIC BUTTON
// ==========================================

micButton.addEventListener(
    "click",
    function () {

        micOn =
            !micOn;


        if (localStream) {

            localStream
                .getAudioTracks()
                .forEach(
                    function (track) {

                        track.enabled =
                            micOn;

                    }
                );

        }


        if (!micOn) {

            lastSpeakingState =
                false;


            setSpeaking(
                false
            );


            if (socket.connected) {

                socket.emit(
                    "speaking",
                    false
                );

            }

        }


        micButton.textContent =
            micOn
                ? "🎤 Mic On"
                : "🔇 Mic Off";

    }
);


// ==========================================
// AUDIO BUTTON
// ==========================================

audioButton.addEventListener(
    "click",
    function () {

        audioOn =
            !audioOn;


        Object.values(
            remoteAudios
        ).forEach(
            function (audio) {

                audio.muted =
                    !audioOn;

            }
        );


        updateProximityAudio();


        audioButton.textContent =
            audioOn
                ? "🔊 Audio On"
                : "🔇 Audio Off";

    }
);


// ==========================================
// LOGOUT
// ==========================================

logoutButton.addEventListener(
    "click",
    function () {

        localStorage.removeItem(
            "proxiSpeakUser"
        );


        if (localStream) {

            localStream
                .getTracks()
                .forEach(
                    function (track) {

                        track.stop();

                    }
                );

        }


        if (audioContext) {

            audioContext.close();

        }


        if (socket.connected) {

            socket.emit(
                "speaking",
                false
            );

        }


        socket.disconnect();


        window.location.href =
            "index.html";

    }
);