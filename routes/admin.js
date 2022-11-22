const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Interaction = require('../models/Interaction');
const { authUser, authRole } = require('../middleware/auth');
const { User_Role, Post_Status } = require('../helper');
//-------------------------------------------------------------------------------------------------

/**
 * @swagger
 * tags:
 *   name: admin
 *   description: admin routes
 */

/**
 * @swagger
 * /admin/statistics:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: return statistical results used only in the dashboard page
 *     tags: [admin]
 *     responses:
 *       200:
 *         description: return statistical results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/statistics'
 *       500:
 *         description: internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: "internal server error"
 */

/**
 * @swagger
 * security:
 *   - bearerAuth: []
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     statistics:
 *       type: object   
 *       properties:
 *         Total_Posts:
 *           type: number
 *           description: total number of all posts
 *         Total_Pending:
 *           type: number
 *           description: total number of pending posts
 *         Total_Approved:
 *           type: number
 *           description: total number of approved posts
 *         Total_Rejected:
 *           type: number
 *           description: total number of rejected posts
 *         Total_Comments:
 *           type: number
 *           description: total number of comments
 *         Total_Interactions:
 *           type: number
 *           description: total number of interactions on posts and comments
 *         Total_Posts_Interactions:
 *           type: number
 *           description: total number of interactions on posts
 *         Total_Comments_Interactions:
 *           type: number
 *           description: total number of interactions on comments
 *       example:
 *        Total_Posts: 10
 *        Total_Pending: 4
 *        Total_Approved: 3
 *        Total_Rejected: 3
 *        Total_Comments: 12
 *        Total_Interactions: 6
 *        Total_Posts_Interactions: 4
 *        Total_Comments_Interactions: 2
 */
//-------------------------------------------------------------------------------------------------
router.get('/statistics', authUser, authRole(User_Role.ADMIN),  async (req, res) => {
    try {
        let Total_Posts, Total_Pending, Total_Approved, Total_Rejected,
            Total_Comments, 
            Total_Interactions, Total_Posts_Interactions, Total_Comments_Interactions;

        const queries = await Promise.allSettled([
            Post.aggregate([{ $match: {} }, { $project: { _id: 0, status: 1 } }]),
            Comment.aggregate([{ $count: "total" }]),
            Interaction.aggregate([{ $project: { _id: 0, comment: 1, post: 1 } }])
        ]);

        const queryResult = queries.filter(f => f.status === "fulfilled").map(m => m.value);
        const [posts, comments, interactions] = queryResult;

        //Posts
        if (posts) {
            Total_Posts = posts.length;
            Total_Pending = posts.filter(f => f.status === Post_Status.PENDING).length;
            Total_Approved = posts.filter(f => f.status === Post_Status.APPROVED).length
            Total_Rejected = posts.filter(f => f.status === Post_Status.REJECTED).length;
        }

        //Comments
        if (comments) {
            Total_Comments = comments[0].total;
        }

        //Interactions
        if (interactions) {
            Total_Interactions = interactions.length;
            Total_Posts_Interactions = interactions.filter(f => f.post).length;
            Total_Comments_Interactions = interactions.filter(f => f.comment).length;
        }

        const result = {
            Total_Posts, Total_Pending, Total_Approved, Total_Rejected,
            Total_Comments, 
            Total_Interactions, Total_Posts_Interactions, Total_Comments_Interactions
        };
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({ status: 500, message: "internal server error" });
    }
})
//-------------------------------------------------------------------------------------------------
module.exports = router;