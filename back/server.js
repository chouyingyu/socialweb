npm init -y
npm install express mongoose bcryptjs jsonwebtoken body-parser corsconst express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');
const User = require('./models/User');
const Post = require('./models/Post');

const app = express();
app.use(bodyParser.json());
app.use(cors());

mongoose.connect('mongodb://localhost:27017/socialplatform', { useNewUrlParser: true, useUnifiedTopology: true });

// JWT密鑰
const JWT_SECRET = 'secret_key_here';

// 用戶註冊
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).send("User registered successfully");
});

// 用戶登入
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET);
        res.json({ token });
    } else {
        res.status(401).send("Invalid credentials");
    }
});

// 驗證token的中間件
function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).send("Token required");
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).send("Invalid token");
        req.user = user;
        next();
    });
}

// 發布貼文
app.post('/post', authenticateToken, async (req, res) => {
    const post = new Post({ content: req.body.content, author: req.user.id });
    await post.save();
    res.status(201).send("Post created successfully");
});

// 按讚貼文
app.post('/like/:postId', authenticateToken, async (req, res) => {
    const post = await Post.findById(req.params.postId);
    post.likes += 1;
    await post.save();
    res.send("Post liked");
});

// 留言
app.post('/comment/:postId', authenticateToken, async (req, res) => {
    const post = await Post.findById(req.params.postId);
    post.comments.push({ content: req.body.content, author: req.user.username });
    await post.save();
    res.send("Comment added");
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));

