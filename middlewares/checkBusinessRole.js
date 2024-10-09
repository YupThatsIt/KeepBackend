const { User } = require("../models/userModel");

const getRole = async (req, res, next) => {
    const userID = req.userID;
    const foundUser = await User.findOne({ _id: userID }).exec();
    // no need to check if user exist or not because JWT verification took care of it already
    foundUser.businessRoles.forEach((business) => {
        if (business.businessID === req.param.businessID){
            req.role = business.role;
            next();
        }
    });
    // In case the user doesn't have any to do with business ID
    return res.status(403).send("User do not have a role in the business");
}

module.exports = getRole;