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
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

// Initialize database. If file does not exist, default
// dataset will be used to create it.
const adapter = new FileSync('db.json');
const db = low(adapter);
db.defaults({
    todos: [],
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

// Heartbeat
app.get('/', (req, res) => {
    res.json({ status: 'OK!' });
});

app.get('/todos', async (req, res) => {
    const todos = db.get('todos').value();

    // This will simulate server loading.
    // Remove if you want to make it fast again.
    // Notice that lambda is marked as async, otherwise
    // it would not work with await.
    await new Promise(resolve => setTimeout(resolve, 1500));

    res.json(todos);
});

app.post('/todos', async (req, res) => {
    // WARNING: Validation is missing, this code is vulnerable
    db.set('todos', req.body).write();

    // Same loading simulation logic as above
    await new Promise(resolve => setTimeout(resolve, 250));

    // 204 NO CONTENT
    res.status(204).json();
});

// This will finally open application to the network.
// It will be listening on the port you have chosen.
// If firewall will be correctly configured, you would
// be able to see it even on the outside network.
// But you can always access it on the local network (localhost).
app.listen(port, () => {
    console.log(`Server started, listening at port ${port}!`);
});
