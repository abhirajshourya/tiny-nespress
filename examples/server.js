const Nespress = require('../lib/index');

// A sample object in this array would look like:
//  { userId: 1, token: 23422341 }
const SESSIONS = [];

const USERS = [
  {
    id: 1,
    name: 'John Doe',
    username: 'johndoe',
    password: 'admin',
  },
  {
    id: 2,
    name: 'Jane Doe',
    username: 'admin',
    password: 'admin',
  },
];

const POSTS = [
  {
    id: 1,
    userId: 1,
    title: 'First Post',
    body: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
  },
];

const PORT = 3000;

const server = new Nespress();

// For authentication
server.beforeEach((req, res, next) => {
  const routesToAuthenticate = [
    'GET /api/user',
    'PUT /api/user',
    'POST /api/posts',
    'DELETE /api/logout',
  ];

  if (routesToAuthenticate.indexOf(req.method + ' ' + req.url) !== -1) {
    // if no cookie, then exit if;
    if (req.headers.cookie) {
      const token = req.headers.cookie.split('token=')[1]?.split(';')[0];
      const session = SESSIONS.find((session) => session.token === token);
      if (session) {
        req.userId = session.userId;
        return next();
      }
    }

    res.status(401).json({ error: 'Unauthorized!' });
  } else {
    next();
  }
});

// For parsing JSON body
server.beforeEach((req, res, next) => {
  if (req.headers['content-type'] === 'application/json') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString('utf-8');
    });

    req.on('end', () => {
      body = JSON.parse(body);
      req.body = body;
      return next();
    });
  } else {
    next();
  }
});

// ----------------- Files Routes -----------------//

// for different routes that need the index.html file
server.beforeEach((req, res, next) => {
  const routes = ['/', '/login', '/profile', '/new-post'];
  if (routes.indexOf(req.url) !== -1 && req.method === 'GET') {
    return res.status(200).sendFile('./public/index.html', 'text/html');
  }

  next();
});

server.route('get', '/styles.css', (req, res) => {
  res.sendFile('./public/styles.css', 'text/css');
});

server.route('get', '/scripts.js', (req, res) => {
  res.sendFile('./public/scripts.js', 'text/javascript');
});

// ----------------- API Routes -----------------//
// all posts
server.route('get', '/api/posts', (req, res) => {
  const posts = POSTS.map((post) => {
    const user = USERS.find((user) => user.id === post.userId);
    post.author = user.name;
    return post;
  });
  res.status(200).json(posts);
});

// create new post
server.route('post', '/api/posts', (req, res) => {
  const title = req.body.title;
  const body = req.body.body;

  const post = {
    id: POSTS.length + 1,
    title,
    body,
    userId: req.userId,
  };
  POSTS.unshift(post);
  res.status(201).json(post);
});

// Send user info
server.route('get', '/api/user', (req, res) => {
  const user = USERS.find((user) => user.id === req.userId);
  res.status(200).json({ username: user.username, name: user.name });
});

// update user info
server.route('put', '/api/user', (req, res) => {
  const name = req.body.name;
  const username = req.body.username;
  const password = req.body.password;

  // Check if user exists
  const user = USERS.find((user) => user.id === req.userId);

  user.username = username;
  user.name = name;

  if (password) {
    user.password = password;
  }

  res.status(200).json({
    username,
    name,
    password_status: password ? 'updated' : 'unchanged',
  });
});

// Login user and set session + cookie
server.route('post', '/api/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  // Check if user exists
  const user = USERS.find((user) => user.username === username);

  // Check the password if user was found
  if (user && user.password === password) {
    // at this point we know the client is authentic

    // generate random token
    const token = Math.floor(Math.random() * 100000000).toString();

    // save the generated token
    SESSIONS.push({ userId: user.id, token });

    res.setHeader('Set-Cookie', `token=${token}; path=/; httponly; max-age=3600`);

    res.status(200).json({
      message: 'You are logged in!',
    });
  } else {
    res.status(401).json({ error: 'Invalid username or password' });
  }
});

// logout user and unset session + cookie
server.route('delete', '/api/logout', (req, res) => {
  const sessionIndex = SESSIONS.findIndex((session) => session.userId !== req.userId);
  if (sessionIndex > -1) {
    SESSIONS.splice(index, 1);
  }
  res.setHeader('Set-Cookie', 'token=deleted; path=/; httponly; max-age=0');
  res.status(200).json({ message: 'You are logged out!' });
});

// ----------------- Listener -----------------//
server.listen(PORT, () => {
  console.log(`Web server is live at http://localhost:${PORT}`);
});
