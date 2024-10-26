const express = require("express");
const router = express.Router();
const { login, logout, handleRefreshToken } = require("../controllers/authController");

/* 
--------------------------------------------
POST /user/login
--------------------------------------------

Detail: Login with username/email and password. Will save refresh token in cookie and return newly generated access token

Input ->    {
                "user": String, (can be username or email)
                "pwd": String,
            }

Outputs ->  Status 200 { "content": accessToken }
            Status 400 "Incomplete input: user and pwd are needed"
            Status 401 "User is not in the system"
            Status 401 "Password is incorrect"
--------------------------------------------
*/ 
router.post("/user/login", login);

/* 
--------------------------------------------
POST /user/logout
--------------------------------------------

Detail: Delete refresh token in cookie and database

NOTE:   access token cannot be delete by backend (not that I knew of)
        please make sure to drop it because of the stateless nature of jwt
        access token is still working, you can still use it until it expired

Input ->  Nothing

Outputs ->  Status 204
--------------------------------------------
*/ 
router.post("/user/logout", logout); // don't need to verify jwt to logout

/* 
--------------------------------------------
GET /access-token-refreshment
--------------------------------------------

Detail: Generate new access token from refresh token

Input -> have refresh token in the cookie

Outputs ->  Status 200 { "content": accessToken }
            Status 401 "Unauthorized"
--------------------------------------------
*/ 
router.get("/access-token-refreshment", handleRefreshToken);

module.exports = router;