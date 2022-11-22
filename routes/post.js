const express = require('express');
const mongoose = require('mongoose');
const { User_Role, Post_Status } = require('../helper');
const { authUser, authRole } = require('../middleware/auth');
const Post = require('../models/Post');
const User = require('../models/User');
const Interaction = require('../models/Interaction');
const router = express.Router();
//-------------------------------------------------------------------------------------------------
/**
 * @swagger
 * tags:
 *   name: post
 *   description: posts routes
 */

/**
 * @swagger
 * /posts:
 *   post:
 *     security:
 *       - bearerAuth: []
 *     summary: add new post by the user
 *     tags: [post]
 *     requestBody:
 *       required: true
 *       content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                title:
 *                  type: string
 *                  example: "post title"
 *                body:
 *                  type: string
 *                  example: "post body"
 *     responses:
 *       200:
 *         description: successfully created the post
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: 
 *                 message:
 *                  type: string
 *                  example: "Post created successfully, waiting for Admin Approval"
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

//-------------------------------------------------------------------------------------------------
router.post('/', authUser, authRole(User_Role.USER), async (req, res) => {
    try {
        const { title, body } = req.body;
        const user_id = mongoose.Types.ObjectId(req.user._id);
        await Post.create({ title, body, createdBy: user_id, status: Post_Status.PENDING });
        return res.status(200).send({ message: "Post created successfully, waiting for Admin Approval" })
    }
    catch (err) {
        return res.status(500).json({ status: 500, message: "internal server error" });
    }
})
//-------------------------------------------------------------------------------------------------
/**
 * @swagger
 * /posts:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: return all posts paginated, only approved posts return for noraml users
 *     tags: [post]
 *     parameters:
 *       - in: query
 *         name: page
 *         default: 1
 *         description: page number
 *         required: false
 *       - in: query
 *         name: limit
 *         default: 10
 *         description: limit number of posts to return
 *         required: false
 *     responses:
 *       200:
 *         description: return list of posts from latest to oldest paginated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: "#/components/schemas/PaginatedPostsResult"
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
 * components:
 *   schemas:
 *     PaginatedPostsResult:
 *       type: object
 *       properties:
 *          data:
 *            type: array
 *            items:
 *              $ref: "#/components/schemas/post"
 *          total:
 *            type: number
 *            description: total number of posts
 *            example: 30
 *          page:
 *            type: number
 *            description: current page number
 *            example: 1 
 *          limit:
 *            type: number
 *            description: maximum number of posts in the page
 *            example: 10
 *          totalPages:
 *            type: number
 *            description: total number of available pages
 *            example: 3
 *          hasNextPage:
 *            type: boolean
 *            description: is there is next page to the current page
 *            example : true 
 *          hasPreviousPage:
 *            type: boolean
 *            description: is there is previous page to the current page
 *            example : false
 *###################################################################################################   
 *     post:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           example: "post title 1"
 *         body:
 *           type: string
 *           example: "post body 1"
 *         status:
 *           type: string
 *           enum: ["APPROVED","PENDING","REJECTED"]
 *         createdBy:
 *           type: object
 *           $ref: "#/components/schemas/createdBy" 
 *         interactions:
 *           type: object
 *           $ref: "#/components/schemas/interactions"
 *###################################################################################################
 *     createdBy:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "282hwi1o1hxyu20isnxkhwju"
 *         email:
 *           type: string
 *           example: "mohamed@deal.com"
 *         role:
 *           type: string
 *           enum: ["USER", "ADMIN"]
 *###################################################################################################
 *     interactions:
 *       type: object
 *       properties:
 *         LIKE:
 *           type: number
 *           required: false
 *           example: 3
 *         DISLIKE:
 *           type: number
 *           required: false
 *           example: 2
 *         SAD:
 *           type: number
 *           required: false
 *           example: 4
 *         ANGRY:
 *           type: number
 *           required: false
 *           example: 1
 * 
 */
//-------------------------------------------------------------------------------------------------
router.get('', authUser, async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skips = limit * (page - 1);
        let condition = {};
        if (req.user.role === User_Role.USER) {
            Object.assign(condition, { status: Post_Status.APPROVED })
        }

        const total = await Post.find(condition).count();
        const posts = await Post.aggregate([
            { $match: condition },
            { $skip: skips },
            { $limit: limit },
            { $sort: { createdAt: -1 } },
            {
                $lookup: {
                    from: User.collection.name,
                    let: { id: "$createdBy" },
                    pipeline: [
                        { $match: { "$expr": { "$eq": ["$$id", "$_id"] } } },
                        { $project: { email: 1, role: 1 } }
                    ],
                    as: "createdBy"
                }
            },
            {
                $lookup: {
                    from: Interaction.collection.name,
                    let: { id: "$_id" },
                    pipeline: [
                        { $match: { "$expr": { "$eq": ["$$id", "$post"] } } },
                        { $group: { _id: "$type", count: { $sum: 1 } } },
                        {
                            $group: {
                                "_id": null,
                                "data": {
                                    $push: {
                                        "k": "$_id",
                                        "v": "$count"
                                    }
                                }
                            }
                        },
                        {
                            $replaceRoot: {
                                newRoot: { "$arrayToObject": "$data" }
                            }
                        }
                    ],
                    as: "interactions"
                }
            }
        ]);
        const totalPages = (total / limit) < 1 ? 1 : Math.ceil((total / limit));
        const result = {
            data: posts,
            total,
            page,
            limit,
            totalPages,
            hasNextPage: totalPages > page,
            hasPreviousPage: page !== 1 && totalPages <= page
        }

        res.send(result);
    }
    catch (err) {
        return res.status(500).json({ status: 500, message: "internal server error" });
    }
})

//-------------------------------------------------------------------------------------------------
module.exports = router;