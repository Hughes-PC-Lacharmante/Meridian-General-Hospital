const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const XLSX = require("xlsx");

const app = express();

const PORT = process.env.PORT || 3000;

const ROOT_DIR = __dirname;

const SECURITY_DIR =
    path.join(
        ROOT_DIR,
        "security"
    );

const DATABASE_FILE =
    path.join(
        SECURITY_DIR,
        "database.xlsx"
    );

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
| EXPRESS
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
| STATIC FILES
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
| ROOT
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

    if (
        !fs.existsSync(
            SECURITY_DIR
        )
    ) {

        fs.mkdirSync(
            SECURITY_DIR,
            {
                recursive: true
            }
        );

    }


    if (
        fs.existsSync(
            DATABASE_FILE
        )
    ) {

        return;

    }


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


    users.forEach(
        function (user) {

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
    );


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
| LEGACY PASSWORD HASH
|--------------------------------------------------------------------------
|
| Intentionally obsolete for the MLHMS academic case study.
| H.A.W.K.S. will replace this with a modern password hashing design.
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


            res
                .status(500)
                .json(
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
| SIGNUP
|--------------------------------------------------------------------------
*/

app.post(
    "/api/signup",
    function (req, res) {

        try {

            const users =
                readUsers();


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
             * Deliberately simplistic legacy
             * session token.
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
| DATABASE:
| LIST EXCEL WORKBOOKS
|--------------------------------------------------------------------------
|
| Searches /security for .xlsx and .xls files.
|--------------------------------------------------------------------------
*/

app.get(
    "/api/database/workbooks",
    function (req, res) {

        try {

            ensureDatabase();


            const files =
                fs.readdirSync(
                    SECURITY_DIR
                );


            const workbooks =
                files
                    .filter(
                        function (file) {

                            return (
                                file
                                    .toLowerCase()
                                    .endsWith(".xlsx") ||
                                file
                                    .toLowerCase()
                                    .endsWith(".xls")
                            );

                        }
                    )
                    .map(
                        function (file) {

                            const fullPath =
                                path.join(
                                    SECURITY_DIR,
                                    file
                                );


                            const workbook =
                                XLSX.readFile(
                                    fullPath,
                                    {
                                        bookSheets:
                                            true
                                    }
                                );


                            return {

                                file,

                                path:
                                    `/security/${file}`,

                                size:
                                    fs.statSync(
                                        fullPath
                                    ).size,

                                sheets:
                                    workbook.SheetNames

                            };

                        }
                    );


            res.json(
                {

                    system:
                        "MLHMS Legacy Database Browser",

                    location:
                        "/security/",

                    workbooks

                }
            );


        } catch (error) {

            console.error(
                "Workbook enumeration error:",
                error
            );


            res
                .status(500)
                .json(
                    {
                        error:
                            "Unable to enumerate legacy workbooks."
                    }
                );

        }

    }
);


/*
|--------------------------------------------------------------------------
| DATABASE:
| WORKBOOK METADATA
|--------------------------------------------------------------------------
*/

app.get(
    "/api/database/workbook/:file",
    function (req, res) {

        try {

            const file =
                path.basename(
                    req.params.file
                );


            if (
                !(
                    file
                        .toLowerCase()
                        .endsWith(".xlsx") ||
                    file
                        .toLowerCase()
                        .endsWith(".xls")
                )
            ) {

                return res
                    .status(400)
                    .json(
                        {
                            error:
                                "Only Excel workbooks are supported."
                        }
                    );

            }


            const workbookPath =
                path.join(
                    SECURITY_DIR,
                    file
                );


            if (
                !fs.existsSync(
                    workbookPath
                )
            ) {

                return res
                    .status(404)
                    .json(
                        {
                            error:
                                "Workbook not found."
                        }
                    );

            }


            const workbook =
                XLSX.readFile(
                    workbookPath,
                    {
                        bookSheets:
                            true
                    }
                );


            res.json(
                {

                    file,

                    size:
                        fs.statSync(
                            workbookPath
                        ).size,

                    sheets:
                        workbook.SheetNames

                }
            );


        } catch (error) {

            console.error(
                "Workbook metadata error:",
                error
            );


            res
                .status(500)
                .json(
                    {
                        error:
                            "Unable to read workbook metadata."
                    }
                );

        }

    }
);


/*
|--------------------------------------------------------------------------
| DATABASE:
| READ WORKSHEET
|--------------------------------------------------------------------------
|
| Returns the worksheet as JSON.
|
| Password fields are masked before leaving the server.
|--------------------------------------------------------------------------
*/

app.get(
    "/api/database/workbook/:file/sheet/:sheet",
    function (req, res) {

        try {

            const file =
                path.basename(
                    req.params.file
                );


            const sheet =
                req.params.sheet;


            const workbookPath =
                path.join(
                    SECURITY_DIR,
                    file
                );


            if (
                !fs.existsSync(
                    workbookPath
                )
            ) {

                return res
                    .status(404)
                    .json(
                        {
                            error:
                                "Workbook not found."
                        }
                    );

            }


            const workbook =
                XLSX.readFile(
                    workbookPath
                );


            if (
                !workbook.Sheets[sheet]
            ) {

                return res
                    .status(404)
                    .json(
                        {
                            error:
                                "Worksheet not found."
                        }
                    );

            }


            const rows =
                XLSX.utils.sheet_to_json(
                    workbook.Sheets[sheet],
                    {
                        defval: ""
                    }
                );


            /*
             * Mask sensitive fields.
             *
             * The legacy workbook can contain the
             * fictional Password field, but the browser
             * doesn't need to receive it.
             */

            const safeRows =
                rows.map(
                    function (row) {

                        const copy =
                            {
                                ...row
                            };


                        Object.keys(
                            copy
                        ).forEach(
                            function (key) {

                                const normalized =
                                    key
                                        .toLowerCase()
                                        .replace(
                                            /[\s_-]/g,
                                            ""
                                        );


                                if (
                                    normalized ===
                                        "password" ||
                                    normalized ===
                                        "passwordhash" ||
                                    normalized.includes(
                                        "apikey"
                                    ) ||
                                    normalized.includes(
                                        "secret"
                                    )
                                ) {

                                    copy[key] =
                                        "[MASKED LEGACY VALUE]";

                                }

                            }
                        );


                        return copy;

                    }
                );


            res.json(
                {

                    file,

                    sheet,

                    rowCount:
                        safeRows.length,

                    rows:
                        safeRows

                }
            );


        } catch (error) {

            console.error(
                "Worksheet read error:",
                error
            );


            res
                .status(500)
                .json(
                    {
                        error:
                            "Unable to read worksheet."
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
            "Meridian General Hospital"
        );

        console.log(
            "MLHMS Legacy Management System"
        );

        console.log(
            "=============================================="
        );

        console.log(
            `Server running on port ${PORT}`
        );

        console.log(
            `Database: ${DATABASE_FILE}`
        );

        console.log(
            "Fictional academic demonstration."
        );

        console.log(
            "Synthetic data only."
        );

    }
);
