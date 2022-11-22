const chai = require("chai");
const chaiHttp = require("chai-http");
const chaiJWT = require('chai-jwt');
const mongoose = require('mongoose');
const { Post_Status } = require("../helper");
const server = require("../index");
const POST = require('../models/Post');
//-------------------------------------------------------------------------------------------------
//Assertion Style
chai.should();

//plugins
chai.use(chaiHttp);
chai.use(chaiJWT);
//-------------------------------------------------------------------------------------------------
const MochData = {
    normal_user: {
        email: "mattie@gmail.com",
        password: "123456",
        token: ''
    },
    admin_user: {
        email: "admin@deal.com",
        password: "deal123",
        token: ''
    },
    fake_post: {
        title: "post title",
        body: "post body",
    },
    posts_total: 0
}
//-------------------------------------------------------------------------------------------------
before(async function () {
    const dbURI = process.env.MONGO_URI;
    mongoose.connect(dbURI);
    MochData.posts_total = await POST.countDocuments();
});
after(async function () {
    mongoose.connection.close()
});
//-------------------------------------------------------------------------------------------------
describe('Integration-Test #1', function () {

    describe('\n(1) POST /user/login (normal user) \n(2) GET /posts \n(3) POST /posts', function () {
        //-----------------------------------------------------------------------------------------
        it('a normal user should be logged in and a valid JWT is returning', (done) => {
            chai.request(server)
                .post("/user/login") // '/user/login' NOT 'user/login'
                .set('content-type', 'application/json')
                .send({ email: MochData.normal_user.email, password: MochData.normal_user.password })
                .end((err, response) => {
                    response.should.have.status(200);
                    response.body.should.be.a.jwt;
                    MochData.normal_user.token = response.body;
                    done();
                })
        });
        //-----------------------------------------------------------------------------------------
        it('returns all approved posts so the user can check it', (done) => {
            chai.request(server)
                .get("/posts")
                .set({ Authorization: `Bearer ${MochData.normal_user.token}` })
                .end((err, response) => {
                    response.should.have.status(200);
                    response.body.should.be.a("object");
                    response.body.should.have.property("data");
                    done();
                })
        })
        //-----------------------------------------------------------------------------------------
        it('the user can create new post - that will be pending', (done) => {
            chai.request(server)
                .post("/posts")
                .set({ Authorization: `Bearer ${MochData.normal_user.token}` })
                .set('content-type', 'application/json')
                .send({ title: MochData.fake_post.title, body: MochData.fake_post.body })
                .end(async (err, response) => {
                    response.should.have.status(200);
                    response.body.should.be.a("object");
                    const newPost = response.body;
                    newPost.should.have.property("message");
                    //delete added post
                    await POST.findOneAndDelete({ status: Post_Status.PENDING }, { sort: { _id: -1 } })
                    done();
                });
        })
    })
});
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
describe("Integration-Test #2", function () {
    describe('\n(1) POST /user/login (admin) \n(2) GET /posts \n(3) GET admin/statistics', function () {
        //-----------------------------------------------------------------------------------------
        it('admin user should be logged in and a JWT is returning', (done) => {
            chai.request(server)
                .post("/user/login")
                .set('content-type', 'application/json')
                .send({ email: MochData.admin_user.email, password: MochData.admin_user.password })
                .end((err, response) => {
                    response.should.have.status(200);
                    response.body.should.be.a.jwt;
                    MochData.admin_user.token = response.body;
                    done();
                })
        });
        //-----------------------------------------------------------------------------------------
        it('returns all posts so the admin can check it', (done) => {
            chai.request(server)
                .get("/posts")
                .set({ Authorization: `Bearer ${MochData.admin_user.token}` })
                .end((err, response) => {
                    response.should.have.status(200);
                    response.body.should.be.a("object");
                    response.body.should.have.property("data");
                    response.body.should.have.property("page");
                    const data = response.body["data"];
                    data.should.have.lengthOf(MochData.posts_total);
                    done();
                })
        })
        //-----------------------------------------------------------------------------------------
        it('admin statistics should be correct', (done) => {
            chai.request(server)
                .get("/admin/statistics")
                .set({ Authorization: `Bearer ${MochData.admin_user.token}` })
                .end((err, response) => {
                    response.should.have.status(200);
                    response.body.should.be.a("object");
                    const result = response.body;
                    result.should.have.property("Total_Posts").and.to.equal(MochData.posts_total)
                    done();
                })
        })
    })
})