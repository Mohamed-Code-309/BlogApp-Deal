const jwt = require("jsonwebtoken");
const User = require("../models/User");
//-------------------------------------------------------------------------------------------------
async function authUser(req, res, next) {
    try {
        if (!req.headers.authorization) {
            return res.status(401).send({ status: 401, message: "You need to sign in" })
        }
        let token = req.headers.authorization.split(' ')[1];
        if (token == 'null') {
            return res.status(401).send({ status: 401, message: "You need to sign in" })
        }

        let payload = jwt.verify(token, process.env.JWT_SECRET);
        if (!payload) {
            return res.status(401).send({ status: 401, message: "You need to sign in" })
        }
        const user = await User.findOne({ _id: payload._id }, { email: 1, role: 1 })
        if (!user) {
            return res.status(403).send({ status: 403, message: "user is not exist anymore" })
        }
        req.user = user;
        next();
    }
    catch (err) {
        return res.status(500).json({ status: 500, message: "internal server error" });
    }
}
//-------------------------------------------------------------------------------------------------
function authRole(role) {
    return (req, res, next) => {
        if (req.user.role !== role) {
            res.status(401)
            return res.json({status: 401, message: 'Not allowed' })
        }
        next()
    }
}
//-------------------------------------------------------------------------------------------------
module.exports = {
    authUser,
    authRole
}
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
