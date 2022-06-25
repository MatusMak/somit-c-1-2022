// Express is a library that will give us ability
// to easily write our REST API
const express = require('express');
// CORS is a middleware that will make it possible to call API from browser
// Learn more https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
const cors = require('cors');
// Morgan is a logging middleware
const morgan = require('morgan');
// LowDB is a file-based JSON database.
// We are using version 1.0.0 as latest 3.0.0 requires
// a bit different syntax and I want to keep things
// as simple as possible
// Documentation: https://github.com/typicode/lowdb/tree/v1.0.0
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
// Hash function for password
const { scryptSync } = require('crypto');

// Initialize database. If file does not exist, default
// dataset will be used to create it.
const adapter = new FileSync('db.json');
const db = low(adapter);
db.defaults({
    articles: [],
}).write();

// We will create an express application that we can
// start building. This is not yet exposed to the network.
// We will also mark port number for convenience.
const app = express();
const port = process.env.PORT;

// In this section, we will apply each middleware to the application
// - cors to enable accessing API in the browser from any URL
// - morgan to log incoming traffic
// - express.json to parse JSON request bodies to JavaScript objects
app.use(cors());
app.use(morgan('common'));
app.use(express.json());

// To generate new password hash
// 1. open terminal
// 2. type "node"
// 3. copy and enter this code (right clicking into the terminal): "const { scryptSync } = require('crypto');"
// 4. copy and enter line below with the salt. You may change it to anything else before.
// 5. copy and enter this code, choose your password: "scryptSync('Choose your password here', salt, 64).toString('hex');"
// 6. copy the resulting text into the password constant below
const salt = 'dfsshjt15511shdf';
const password = '010f091dec1e3eb2034b797cd63668835de9b8095e80bbd815c21ab42ac602b04f0f25da43a2e6e3f8496f4a527d9bb01b056af5fa368f46271611a0fc1242aa';

// Middleware (software executed before our endpoint code)
// used to check whether there is authenticated user or not.
// It is simplest possible authentication protection.
const checkPassword = (req, res, next) => {
  // Passwords are passed via "Authorization" header
  // of the request, here we can read it like this
  const userPassword = req.headers.authorization;
  
  // If there is no password provided, user is not
  // authenticated - we will return 401 code and end
  // the request
  if (! userPassword) {
    res.status(401).json();
    return;
  }
  
  // Because we are storing password in a secure hashed form,
  // we need to take authorization password and hash it again
  // so that we can compare hashes
  const userHash = scryptSync(userPassword, salt, 64).toString('hex');
  
  // If hashes are the same, it means both passwords (provided and original)
  // must be the same - we will let user continue by calling next.
  // Otherwise, we will display 401 code.
  if (userHash === password) {
    next();
  } else {
    res.status(401).json();
  }
};

// Heartbeat
app.get('/', (req, res) => {
    res.json({ status: 'OK!' });
});

// Retrieval of all articles
app.get('/articles', async (req, res) => {
  const articles = db.get('articles').value();
  res.json(articles);
});

// Creation of new article
// Password protected
app.post('/articles', checkPassword, async (req, res) => {
  // WARNING: Validation is missing, this code is vulnerable
  const article = {
    // Randomly generates ids from <0, 1 000 000) range
    id: Math.floor(Math.random() * 1000000),
    cover: req.body.cover,
    author: req.body.author,
    date: new Date().toLocaleDateString('sk'),
    title: req.body.title,
    body: req.body.body,
  };

  // Pushes new article to the database
  db.get('articles')
    .push(article)
    .write();

  // 201 CREATED
  res.status(201).json(article);
});

// Updates article
// Password protected
app.put('/articles/:id', checkPassword, async (req, res) => {
  // Artile id is in the URL, but in a string format,
  // so we need to parse it to integer for search to work
  const id = parseInt(req.params.id);

  // WARNING: Validation is missing, this code is vulnerable
  // Here, we are only specifying fields that needs changing.
  const article = {
    cover: req.body.cover,
    author: req.body.author,
    title: req.body.title,
    body: req.body.body,
  };

  // Finds article by its ID and updates its contents
  db.get('articles')
    .find({ id })
    .assign(article)
    .write();

  // 204 NO CONTENT
  res.status(204).json();
});

// Removes article
// Password protected
app.delete('/articles/:id', checkPassword, async (req, res) => {
  const id = parseInt(req.params.id);
  
  db.get('articles')
    .remove({ id })
    .write();

  // 204 NO CONTENT
  res.status(204).json();
});

// Retrieves specific article with given ID
app.get('/articles/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  
  const article = db.get('articles')
    .find({ id })
    .value();

  if (article) {
    res.json(article);
  } else {
    // 404 NOT FOUND
    res.status(404).json();
  }
});

// This will finally open application to the network.
// It will be listening on the port you have chosen.
// If firewall will be correctly configured, you would
// be able to see it even on the outside network.
// But you can always access it on the local network (localhost).
app.listen(port, () => {
    console.log(`Server started, listening at port ${port}!`);
});
