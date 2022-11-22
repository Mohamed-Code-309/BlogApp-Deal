const express = require('express');
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require('../models/User');
const maxAge = 5 * 24 * 60 * 60; //5 days
//-------------------------------------------------------------------------------------------------

/**
 * @swagger
 * tags:
 *   name: user
 *   description: user routes
 */

/**
 * @swagger
 * /user/login:
 *   post:
 *     summary: login api
 *     tags: [user]
 *     requestBody:
 *       required: true
 *       content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                email:
 *                  type: string
 *                  example: mattie@gmail.com
 *                password:
 *                  type: string
 *                  example: 123456
 *     responses:
 *       200:
 *         description: return json web token of the logged user
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               description: json web token 
 *               example: "skwu1h1io1181o18wb2o1...etc"
 *       404:
 *         description: email not exist 
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 404
 *                 message:
 *                   type: string
 *                   example: "user is not existed"
 *       403:
 *         description: email exist but worng password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 403
 *                 message:
 *                   type: string
 *                   example: "Incorrect password"
 */
//-------------------------------------------------------------------------------------------------
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ status: 404, message: "user is not existed" });
        }
        const auth = await bcrypt.compare(password, user.password);
        if (!auth) {
            return res.status(403).json({ status: 403, message: "Incorrect password" });
        }
        const _id = user._id;
        const token = jwt.sign({ _id, email }, process.env.JWT_SECRET, { expiresIn: maxAge });
        return res.status(200).json(token);
    }
    catch (ex) {
        return res.status(500).json({ status: 500, message: "internal server error" });
    }
})
//-------------------------------------------------------------------------------------------------
//testing route
router.post('/', async (req, res) => {
    const { email, password } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    const user = await User.create({ email, password: hashPassword });
    return res.json(user);
})
//-------------------------------------------------------------------------------------------------
module.exports = router;