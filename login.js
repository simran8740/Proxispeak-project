// ==========================================
// PROXISPEAK LOGIN JAVASCRIPT
// ==========================================

const loginForm =
    document.getElementById("loginForm");

const usernameInput =
    document.getElementById("username");

const passwordInput =
    document.getElementById("password");

const loginMessage =
    document.getElementById("loginMessage");

const demoButton =
    document.getElementById("demoButton");


// ==========================================
// LOGIN
// ==========================================

loginForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        const username =
            usernameInput.value.trim();

        const password =
            passwordInput.value.trim();


        // ======================================
        // CHECK EMPTY FIELDS
        // ======================================

        if (
            username === "" ||
            password === ""
        ) {

            loginMessage.textContent =
                "Please enter username and password.";

            return;

        }


        // ======================================
        // LOGIN SUCCESS
        // ======================================

        localStorage.setItem(
            "proxiSpeakUser",
            username
        );


        loginMessage.textContent =
            "Login successful!";


        // Open office

        setTimeout(
            function () {

                window.location.href =
                    "office.html";

            },
            500
        );

    }
);


// ==========================================
// DEMO USER
// ==========================================

demoButton.addEventListener(
    "click",
    function () {

        localStorage.setItem(
            "proxiSpeakUser",
            "Demo User"
        );


        window.location.href =
            "office.html";

    }
);