require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('./db'); // 引入資料庫模組
const app = express();

// 中間件設置（用於解析 JSON 請求）
app.use(express.json());

// 基本路由
app.get('/', (req, res) => {
  res.send('Welcome to the Social Platform API');
});

// 設定伺服器監聽的端口
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// 註冊用戶路由
app.post('/register', async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).send({ message: 'Username, password, and email are required' });
  }

  try {
    // 檢查用戶名是否已經存在
    const [usernameResults] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (usernameResults.length > 0) {
      return res.status(400).send({ message: 'Username already exists' });
    }

    // 檢查 email 是否已經存在
    const [emailResults] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (emailResults.length > 0) {
      return res.status(400).send({ message: 'Email already exists' });
    }

    // 密碼加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 儲存用戶資料
    await db.execute('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [username, hashedPassword, email]);

    res.status(201).send({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error in registration process:', error);
    res.status(500).send({ message: 'Error registering user', error: error.message });
  }
});

// 登入用戶路由
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send({ message: 'Username and password are required' });
  }

  try {
    // 查找用戶
    const [users] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      return res.status(400).send({ message: 'User not found' });
    }

    const user = users[0];

    // 比對密碼
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).send({ message: 'Incorrect password' });
    }

    res.status(200).send({ message: 'Login successful' });
  } catch (error) {
    console.error('Error in login process:', error);
    res.status(500).send({ message: 'Error logging in', error: error.message });
  }
});
