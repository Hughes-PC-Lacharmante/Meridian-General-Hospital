const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const XLSX = require("xlsx");

const app = express();

const PORT = process.env.PORT || 3000;

/*
|--------------------------------------------------------------------------
| MLHMS LEGACY SERVER
|--------------------------------------------------------------------------
|
| Fictional academic system for Meridian General Hospital.
|
| IMPORTANT:
| This intentionally models poor legacy design decisions for comparison
| against the future H.A.W.K.S. system.
|
| DO NOT use this architecture with real healthcare information.
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| PATHS
|--------------------------------------------------------------------------
*/

const ROOT_DIR = __dirname;

const DATABASE_FILE = path.join(
    ROOT_DIR,
    "security",
    "database.xlsx"
);


/*
|--------------------------------------------------------------------------
| REQUIRED LEGACY DATABASE HEADERS
|--------------------------------------------------------------------------
*/

const DATABASE_HEADERS = [
    "First Name",
    "Middle Name",
    "Last Name",
    "Title",
    "Username",
    "Password",
    "Date of Entry",
    "Date of Termination",
    "Department",
    "Line Manager/Supervisor",
    "Role",
    "Role Type",
    "Last Password Change",
    "Password Expiry Date",
    "Password Strength"
];


/*
|--------------------------------------------------------------------------
| EXPRESS CONFIGURATION
|--------------------------------------------------------------------------
*/

app.use(
    express.json()
);

app.use(
    express.urlencoded({
        extended: false
    })
);


/*
|--------------------------------------------------------------------------
| LEGACY STATIC FILE HANDLING
|--------------------------------------------------------------------------
|
| We intentionally serve the repository root directly.
|
| This allows the existing MLHMS structure to remain intact:
|
| /
| ├── index.html
| ├── routes/
| ├── modules/
| ├── api/
| └── security/
|
|--------------------------------------------------------------------------
*/

app.use(
    express.static(
        ROOT_DIR,
        {
            index: false
        }
    )
);


/*
|--------------------------------------------------------------------------
| ROOT PAGE
|--------------------------------------------------------------------------
*/

app.get(
    "/",
    function (req, res) {

        res.sendFile(
            path.join(
                ROOT_DIR,
                "index.html"
            )
        );

    }
);


/*
|--------------------------------------------------------------------------
| DATABASE INITIALIZATION
|--------------------------------------------------------------------------
*/

function ensureDatabase() {

    const databaseDirectory =
        path.dirname(
            DATABASE_FILE
        );

    /*
     * Create /security if it doesn't
     * already exist.
     */

    if (
        !fs.existsSync(
            databaseDirectory
        )
    ) {

        fs.mkdirSync(
            databaseDirectory,
            {
                recursive: true
            }
        );

    }


    /*
     * If database.xlsx already exists,
     * MLHMS keeps using it.
     */

    if (
        fs.existsSync(
            DATABASE_FILE
        )
    ) {

        return;

    }


    /*
     * Otherwise create a basic
     * legacy workbook.
     */

    const workbook =
        XLSX.utils.book_new();

    const worksheet =
        XLSX.utils.aoa_to_sheet(
            [
                DATABASE_HEADERS
            ]
        );

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Users"
    );

    XLSX.writeFile(
        workbook,
        DATABASE_FILE
    );

}


/*
|--------------------------------------------------------------------------
| READ USERS
|--------------------------------------------------------------------------
*/

function readUsers() {

    ensureDatabase();


    const workbook =
        XLSX.readFile(
            DATABASE_FILE
        );


    /*
     * MLHMS expects a worksheet
     * called "Users".
     */

    const worksheet =
        workbook.Sheets.Users ||
        workbook.Sheets[
            workbook.SheetNames[0]
        ];


    if (!worksheet) {

        return [];

    }


    return XLSX.utils.sheet_to_json(
        worksheet,
        {
            defval: ""
        }
    );

}


/*
|--------------------------------------------------------------------------
| WRITE USERS
|--------------------------------------------------------------------------
*/

function writeUsers(
    users
) {

    ensureDatabase();


    const rows = [
        DATABASE_HEADERS
    ];


    for (
        const user of users
    ) {

        rows.push(
            DATABASE_HEADERS.map(
                function (header) {

                    return (
                        user[header] ??
                        ""
                    );

                }
            )
        );

    }


    const worksheet =
        XLSX.utils.aoa_to_sheet(
            rows
        );


    const workbook =
        XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Users"
    );


    XLSX.writeFile(
        workbook,
        DATABASE_FILE
    );

}


/*
|--------------------------------------------------------------------------
| LEGACY PASSWORD FUNCTION
|--------------------------------------------------------------------------
|
| INTENTIONAL FLAW FOR THE CASE STUDY:
|
| The old system uses SHA-256 directly instead
| of a modern password-hashing algorithm.
|
| H.A.W.K.S. will replace this completely.
|
|--------------------------------------------------------------------------
*/

function legacyPasswordHash(
    password
) {

    return crypto
        .createHash(
            "sha256"
        )
        .update(
            password,
            "utf8"
        )
        .digest(
            "hex"
        );

}


/*
|--------------------------------------------------------------------------
| PASSWORD STRENGTH
|--------------------------------------------------------------------------
|
| The system records a password-strength
| label in the Excel workbook.
|
|--------------------------------------------------------------------------
*/

function calculatePasswordStrength(
    password
) {

    let score = 0;


    if (
        password.length >= 8
    ) {

        score++;

    }


    if (
        /[a-z]/.test(password) &&
        /[A-Z]/.test(password)
    ) {

        score++;

    }


    if (
        /\d/.test(password)
    ) {

        score++;

    }


    if (
        /[^A-Za-z0-9]/.test(password)
    ) {

        score++;

    }


    const labels = [
        "Very Weak",
        "Weak",
        "Fair",
        "Good",
        "Strong"
    ];


    return (
        labels[score] ||
        "Very Weak"
    );

}


/*
|--------------------------------------------------------------------------
| SYSTEM STATUS
|--------------------------------------------------------------------------
|
| The login page uses this endpoint to determine whether
| the "Create First Local Account" button should be shown.
|
|--------------------------------------------------------------------------
*/

app.get(
    "/api/system-status",
    function (req, res) {

        try {

            const users =
                readUsers();


            res.json(
                {

                    system:
                        "Meridian Legacy Healthcare Management System",

                    shortName:
                        "MLHMS",

                    hospital:
                        "Meridian General Hospital",

                    version:
                        "4.7.2",

                    database:
                        "/security/database.xlsx",

                    userCount:
                        users.length,

                    signupAvailable:
                        users.length === 0,

                    environment:
                        "Legacy Production Demonstration",

                    warning:
                        "Fictional academic system using synthetic data only."

                }
            );

        } catch (error) {

            console.error(
                "System status error:",
                error
            );

            res.status(
                500
            ).json(
                {
                    error:
                        "Unable to read MLHMS system status."
                }
            );

        }

    }
);


/*
|--------------------------------------------------------------------------
| SIGN UP
|--------------------------------------------------------------------------
|
| INTENTIONAL LEGACY BEHAVIOR:
|
| MLHMS only allows the first local account to be created.
|
| After that, registration disappears.
|
|--------------------------------------------------------------------------
*/

app.post(
    "/api/signup",
    function (req, res) {

        try {

            const users =
                readUsers();


            /*
             * The legacy system only
             * supports its first local account.
             */

            if (
                users.length > 0
            ) {

                return res
                    .status(403)
                    .json(
                        {
                            error:
                                "Registration is disabled after the first local account has been created."
                        }
                    );

            }


            const {
                firstName,
                middleName = "",
                lastName,
                title = "Mr",
                username,
                password,
                department = "IT"
            } = req.body;


            /*
             * Basic input checks.
             */

            if (
                !firstName ||
                !lastName ||
                !username ||
                !password
            ) {

                return res
                    .status(400)
                    .json(
                        {
                            error:
                                "Required fields are missing."
                        }
                    );

            }


            /*
             * Username restriction.
             */

            if (
                !/^[A-Za-z0-9._-]{3,32}$/
                    .test(
                        username
                    )
            ) {

                return res
                    .status(400)
                    .json(
                        {
                            error:
                                "Invalid username format."
                        }
                    );

            }


            /*
             * Legacy password requirement.
             */

            if (
                password.length < 8
            ) {

                return res
                    .status(400)
                    .json(
                        {
                            error:
                                "Password must contain at least 8 characters."
                        }
                    );

            }


            const now =
                new Date();


            const expiryDate =
                new Date(
                    now
                );


            expiryDate.setDate(
                expiryDate.getDate() +
                90
            );


            /*
             * Create the legacy account.
             */

            const newUser = {

                "First Name":
                    firstName,

                "Middle Name":
                    middleName,

                "Last Name":
                    lastName,

                "Title":
                    title,

                "Username":
                    username,

                /*
                 * Intentionally weak representation.
                 * Academic demonstration only.
                 */
                "Password":
                    "LEGACY-SHA256:" +
                    legacyPasswordHash(
                        password
                    ),

                "Date of Entry":
                    now.toISOString()
                        .slice(
                            0,
                            10
                        ),

                "Date of Termination":
                    "",

                "Department":
                    department,

                "Line Manager/Supervisor":
                    "Unassigned",

                "Role":
                    "System Administrator",

                "Role Type":
                    "Privileged",

                "Last Password Change":
                    now.toISOString()
                        .slice(
                            0,
                            10
                        ),

                "Password Expiry Date":
                    expiryDate
                        .toISOString()
                        .slice(
                            0,
                            10
                        ),

                "Password Strength":
                    calculatePasswordStrength(
                        password
                    )

            };


            /*
             * Write the user into
             * the Excel database.
             */

            writeUsers(
                [
                    newUser
                ]
            );


            res
                .status(201)
                .json(
                    {

                        message:
                            "Legacy account created successfully.",

                        signupAvailable:
                            false

                    }
                );


        } catch (error) {

            console.error(
                "Signup error:",
                error
            );

            res
                .status(500)
                .json(
                    {
                        error:
                            "MLHMS could not create the account."
                    }
                );

        }

    }
);


/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

app.post(
    "/api/login",
    function (req, res) {

        try {

            const users =
                readUsers();


            const {
                username,
                password
            } = req.body;


            /*
             * Find account.
             */

            const user =
                users.find(
                    function (entry) {

                        return String(
                            entry.Username
                        )
                            .toLowerCase() ===
                            String(
                                username || ""
                            )
                            .toLowerCase();

                    }
                );


            if (!user) {

                return res
                    .status(401)
                    .json(
                        {
                            error:
                                "Invalid username or password."
                        }
                    );

            }


            /*
             * Legacy password comparison.
             */

            const expectedPassword =
                "LEGACY-SHA256:" +
                legacyPasswordHash(
                    password || ""
                );


            if (
                String(
                    user.Password
                ) !==
                expectedPassword
            ) {

                return res
                    .status(401)
                    .json(
                        {
                            error:
                                "Invalid username or password."
                        }
                    );

            }


            /*
             * Intentionally simplistic login response.
             *
             * A proper system would use robust,
             * expiring server-side sessions or
             * properly managed secure tokens.
             */

            const token =
                crypto
                    .randomBytes(
                        16
                    )
                    .toString(
                        "hex"
                    );


            res.json(
                {

                    message:
                        "Login successful.",

                    token,

                    user: {

                        name:
                            `${user["First Name"]} ${user["Last Name"]}`,

                        username:
                            user.Username,

                        department:
                            user.Department,

                        role:
                            user.Role

                    }

                }
            );


        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            res
                .status(500)
                .json(
                    {
                        error:
                            "MLHMS login service failed."
                    }
                );

        }

    }
);


/*
|--------------------------------------------------------------------------
| LEGACY USER ENDPOINT
|--------------------------------------------------------------------------
|
| INTENTIONAL CASE-STUDY WEAKNESS:
|
| This endpoint does not enforce a proper administrator
| authorization check.
|
| It demonstrates how a badly managed extension/API
| can expose information outside the intended security
| boundary.
|
|--------------------------------------------------------------------------
*/

app.get(
    "/api/users",
    function (req, res) {

        try {

            const users =
                readUsers();


            const safeView =
                users.map(
                    function (user) {

                        return {

                            username:
                                user.Username,

                            name:
                                `${user["First Name"]} ${user["Last Name"]}`,

                            department:
                                user.Department,

                            role:
                                user.Role,

                            status:
                                user[
                                    "Date of Termination"
                                ]
                                    ? "Terminated"
                                    : "Active"

                        };

                    }
                );


            res.json(
                {

                    warning:
                        "Legacy MLHMS endpoint. Authorization controls are incomplete.",

                    users:
                        safeView

                }
            );


        } catch (error) {

            console.error(
                "User endpoint error:",
                error
            );

            res
                .status(500)
                .json(
                    {
                        error:
                            "Unable to retrieve users."
                    }
                );

        }

    }
);


/*
|--------------------------------------------------------------------------
| SIMPLE HEALTH CHECK
|--------------------------------------------------------------------------
*/

app.get(
    "/api/health",
    function (req, res) {

        res.json(
            {
                status:
                    "online",

                system:
                    "MLHMS",

                database:
                    fs.existsSync(
                        DATABASE_FILE
                    )
                        ? "available"
                        : "missing"

            }
        );

    }
);


/*
|--------------------------------------------------------------------------
| ERROR HANDLER
|--------------------------------------------------------------------------
*/

app.use(
    function (
        error,
        req,
        res,
        next
    ) {

        console.error(
            error
        );

        res
            .status(500)
            .json(
                {
                    error:
                        "Internal MLHMS server error."
                }
            );

    }
);


/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/

ensureDatabase();


app.listen(
    PORT,
    function () {

        console.log(
            "=============================================="
        );

        console.log(
            " Meridian General Hospital"
        );

        console.log(
            " MLHMS Legacy Management System"
        );

        console.log(
            "=============================================="
        );

        console.log(
            `Server: http://localhost:${PORT}`
        );

        console.log(
            `Database: ${DATABASE_FILE}`
        );

        console.log(
            "WARNING: Fictional academic demonstration."
        );

        console.log(
            "Synthetic data only."
        );

    }
);
