const cloudinary = require("../middleware/cloudinary");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const User = require("../models/User");

module.exports = {
  getProfile: async (req, res) => {
    try {
      const posts = await Post.find({ user: req.user.id });
      res.render("profile.ejs", { posts: posts, user: req.user });
    } catch (err) {
      console.log(err);
    }
  },
  getFeed: async (req, res) => {
    try {
      const posts = await Post.find().sort({ createdAt: "desc" })
        .populate("user", "userName")  
        .lean();
      console.log(posts, "posts")
      res.render("feed.ejs", { posts: posts });
    } catch (err) {
      console.log(err);
    }
  },
  getPost: async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      console.log(post)
      console.log("postuser")
      console.log(post.user)
      const author = await User.findById(post.user)
      console.log("author")
      console.log(author)

      const comments = await Comment.find({ post: req.params.id })
        .sort({ createdAt: "desc" })
        .populate("author", "userName")
        .lean();
      console.log(comments, "commenttooo")
      res.render("post.ejs", { post: post, user: req.user, comments: comments, author: author });
    } catch (err) {
      console.log(err);
    }
  },
  createPost: async (req, res) => {
    try {
      // Upload image to cloudinary
      const result = await cloudinary.uploader.upload(req.file.path);

      await Post.create({
        title: req.body.title,
        image: result.secure_url,
        cloudinaryId: result.public_id,
        caption: req.body.caption,
        likes: 0,
        user: req.user.id,
      });
      console.log("Post has been added!");
      res.redirect("/profile");
    } catch (err) {
      console.log(err);
    }
  },
  likePost: async (req, res) => {
    try {
      await Post.findOneAndUpdate(
        { _id: req.params.id },
        {
          $inc: { likes: 1 },
        }
      );
      console.log("Likes +1");
      res.redirect(`/post/${req.params.id}`);
    } catch (err) {
      console.log(err);
    }
  },
  deletePost: async (req, res) => {
    try {
      // Find post by id
      let post = await Post.findById({ _id: req.params.id });
      // Delete image from cloudinary
      await cloudinary.uploader.destroy(post.cloudinaryId);
      // Delete post from db
      await Post.remove({ _id: req.params.id });
      console.log("Deleted Post");
      res.redirect("/profile");
    } catch (err) {
      res.redirect("/profile");
    }
  },

  deleteComment: async (req, res) => {
    try {
      // Find post by id
      console.log(req.params.id, "req params id")
      let comment = await Comment.findById({ _id: req.params.id }).lean();
      await Comment.deleteOne({ _id: req.params.id });
      console.log("Deleted Comment");
      res.redirect(`/post/${comment.post}`);
    } catch (err) {
      res.redirect("/profile");
    }
  },
};
