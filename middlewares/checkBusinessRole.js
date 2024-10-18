const { User } = require("../models/userModel");
const { Business } = require("../models/businessModel");

const verifyRole = async (req, res, next) => {
    // find the user
    const userID = req.userID;
    const foundUser = await User.findOne({ _id: userID }).exec();

    const fullBusinessName = req.params.businessName;
    let businessName, businessBranch;
    if (fullBusinessName.includes("-")){
        businessName = decodeURI(fullBusinessName.split("-")[0]);
        businessBranch = decodeURI(fullBusinessName.split("-")[1]);
    }
    else {
        businessName = decodeURI(fullBusinessName);
        businessBranch = "main";
    }
    const foundBusiness = await Business.findOne({ $and: [ {"name": businessName}, {"branch": businessBranch}] }).exec();
    if (!foundBusiness) return res.status(401).json({
        "status": "error",
        "message": `business:${businessName}, branch:${businessBranch} is not in the system`
    });

    // no need to check if user exist or not because JWT verification took care of it already
    let roleFounded = false;
    foundUser.businessRoles.forEach((business) => {
        if (business.businessID.equals(foundBusiness._id)){
            req.role = business.role;
            req.businessID = foundBusiness._id;
            roleFounded = true;
            next();
        }
    });

    // In case the user doesn't have any to do with business ID
    if (!roleFounded) return res.status(403).json({
        "status": "error",
        "message": "User do not have any role in the business"
    });
}

module.exports = verifyRole;