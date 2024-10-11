const express = require("express");
const router = express.Router();
const { login, logout, handleRefreshToken } = require("../controllers/authController");

/* 
--------------------------------------------
POST /user/login
--------------------------------------------

Detail: 1. check if the input user or email exists
        2. check if the password is correct
        3. keep the refresh token in the User mongoDb document
        4. return refresh token in cookie with key "jwt"
        5. return JSON with access token as the key

Input ->    {
                "user": String, (can be username or email)
                "pwd": String,
            }

Outputs ->  Status 200 { accessToken: String }
            Status 400
            Status 401
            Status 500
--------------------------------------------
*/ 
router.post("/user/login", login);

/* 
--------------------------------------------
POST /user/logout
--------------------------------------------

Detail: 1

NOTE:   access token cannot be delete by backend (not that I knew of)
        please make sure to drop it because of the stateless nature of jwt
        access token is still working, you can still use it until it expired

Input ->  Nothing

Outputs ->  Status 204
            Status 403
            Status 500
--------------------------------------------
*/ 
router.get("/user/logout",  logout); // don't need to verify jwt to logout

/* 
--------------------------------------------
GET /access-token-refreshment
--------------------------------------------

Detail: 1. get refresh token from the cookie
        2. check if the refresh token from the cookie match the database
        3. if match then return a new access token with renew expiration

Input -> have refresh token in the cookie

Outputs ->  Status 200 { accessToken: String }
            Status 204 (if refresh token is not in the cookie)
            Status 500
--------------------------------------------
*/ 
router.get("/access-token-refreshment", handleRefreshToken);

module.exports = router;