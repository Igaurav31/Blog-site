
const express = require("express");
const bodyParser = require("body-parser");

const session = require('express-session');
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require('mongoose');


const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const app = express();

app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
  })
);

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb://127.0.0.1/blogDB', { useNewUrlParser: true, useUnifiedTopology: true });

const postSchema = mongoose.Schema({
  postTitle: String,
  postBody: String,
  postImage: String
});

const adminSchmea = mongoose.Schema({
  userName : String,
  password : String
})

const post = mongoose.model("post", postSchema);

const Admin = mongoose.model("admin", adminSchmea);

const isAuthenticated = (req, res, next) => {
  if (req.session.email) {
    // User is authenticated
    next();
  } else {
    // User is not authenticated
    res.redirect('/adminLogin');
  }
}; 

app.get("/", function(req, res){
  post.find({}) 
    .then(posts => {
      res.render("home", {
        startingContent: homeStartingContent,
        posts: posts
      });
    })
    .catch(err => {
      console.error('Error retrieving posts', err);
      res.status(500).send('Internal Server Error');
    });
});




app.get("/about", function(req, res){
  res.render("about", {aboutContent: aboutContent});
});

app.get("/contact", function(req, res){
  res.render("contact", {contactContent: contactContent});
});

app.get("/compose", isAuthenticated, function(req, res){
  post.find({})
    .then(posts => {
      res.render("compose", { posts: posts });
    })
    .catch(err => {
      console.error('Error retrieving posts', err);
      res.status(500).send('Internal Server Error');
    });
});

app.get('/adminLogin', (req, res) => {
  res.render('adminLogin'); 
});

app.post('/adminLogin', async (req, res) => {
  const { email, password } = req.body;
  console.log(`${email} is trying to log in`);

  try {

    const admin = await Admin.findOne({ userName: email });

    if (!admin) {
      return res.status(401).send('Email not found');
    }

    if (password !== admin.password) {
      return res.status(401).send('Wrong password');
    }

    req.session.email = admin.userName;
    console.log('Logged in');

    res.redirect('/compose');
  } catch (err) {
    console.error(err);
    return res.status(500).send('Internal Server Error');
  }
});

app.post('/compose', isAuthenticated, (req, res) => {
  const postTitle = req.body.postTitle;
  const postBody = req.body.postBody;
  // const postId = req.body.postId; 

 
    // Create operation
    const newPost = new post({
      postTitle: postTitle,
      postBody: postBody
    });

    newPost.save()
      .then(() => {
        console.log('Post created successfully');
        res.redirect('/compose');
      })
      .catch(err => {
        console.error('Error creating post', err);
        res.status(500).send('Internal Server Error');
      });
});


app.get("/posts/:postID", function(req, res){
  const requestedPostId = req.params.postID;

  post.findOne({_id: requestedPostId})
    .then(post => {
      res.render("post", {
        title: post.postTitle,
        content: post.postBody
      });
    })
    .catch(err => {
      console.error(err);
      res.redirect("/");
    });
});

app.post('/compose/delete/:postId', isAuthenticated, (req, res) => {
  const postId = req.params.postId;

  post.findByIdAndDelete(postId)
    .then(() => {
      console.log('Post deleted successfully');
      // res.send('post deleted successfully');
      res.redirect('/compose');
    })
    .catch(err => {
      console.error('Error deleting post', err);
      res.status(500).send('Internal Server Error');
    });
});

app.get('/compose/:postId/edit', isAuthenticated, (req, res) => {
  const postId = req.params.postId;

  post.findById(postId)
    .then(post => {
      res.render('edit', { post: post });
    })
    .catch(err => {
      console.error('Error retrieving post for editing', err);
      res.status(500).send('Internal Server Error');
    });
});


app.post('/compose/update/:postId', isAuthenticated, (req, res) => {
  const postId = req.params.postId;
  const updatedPost = {
    postTitle: req.body.postTitle,
    postBody: req.body.postBody
  };

  post.findByIdAndUpdate(postId, updatedPost)
    .then(() => {
 
      res.redirect('/compose'); 
    })
    .catch(err => {
      console.error('Error updating post', err);
      res.status(500).send('Internal Server Error');
    });
});



app.listen(3000, function() {
  console.log("Server started on port 3000");
});
