const express = require("express");
const helmet = require("helmet");
const expressEnforcesSSL = require("express-enforces-ssl");
// const PORT = 3001;
const PORT = process.env.PORT || 3001;

//
const http = require("http");
const WebSocket = require("ws");
const SocketServer = WebSocket.Server;
const uuidv1 = require("uuid/v1");
//

const app = express();

// Initialize an express app with some security defaults
app.use(https).use(helmet());

// Application-specific routes
// Add your own routes here!
// app.get("/example-path", async (req, res, next) => {
//   res.json({ message: "Hello World!" });
// });

// Serve static assets built by create-react-app
app.use(express.static("build"));

// If no explicit matches were found, serve index.html
app.get("*", function(req, res) {
  res.sendFile(__dirname + "/build/index.html");
});

app.use(notfound).use(errors);

//

// Create the WebSockets server
const server = http.createServer(app);
var serverOnPort = server.listen(PORT);
const wss = new SocketServer({ server: serverOnPort });

// Set up a callback that will run when a client connects to the server
// When a client connects they are assigned a socket, represented by
// the ws parameter in the callback.

let userCount = 0;

wss.on("connection", ws => {
  console.log("Client connected");

  userCount++;
  console.log("userCount:", userCount);

  //add userCount (to parsedMessage) to be passed to each client
  let userCountObj = {
    type: "userCount",
    userCount: userCount
  };

  console.log("userCountObj:", userCountObj);

  //send message to client (userCount number)
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(userCountObj));
    }
  });

  ws.on("message", function incoming(message) {
    // console.log("received a messge");
    let parsedMessage = JSON.parse(message);

    parsedMessage.id = uuidv1();

    //add message "type" depending on the message receied from the client
    if (parsedMessage.type === "postMessage") {
      parsedMessage.type = "incomingMessage";
    } else if (parsedMessage.type === "postImage") {
      parsedMessage.type = "incomingImage";
      console.log("received image");
    } else if (parsedMessage.type === "postNotification") {
      parsedMessage.type = "incomingNotification";
    }

    //send message to client (message)
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(parsedMessage));
      }
    });
  });

  // Set up a callback for when a client closes the socket. This usually means they closed their browser.
  ws.on("close", () => {
    console.log("Client disconnected");
    userCount--;
    console.log("userCount:", userCount);
  });
});

//

function https(req, res, next) {
  if (process.env.NODE_ENV === "production") {
    const proto = req.headers["x-forwarded-proto"];
    if (proto === "https" || proto === undefined) {
      return next();
    }
    return res.redirect(301, `https://${req.get("Host")}${req.originalUrl}`);
  } else {
    return next();
  }
}

function notfound(req, res, next) {
  res.status(404).send("Not Found");
}

function errors(err, req, res, next) {
  console.log(err);
  res.status(500).send("something went wrong");
}

// app.listen(PORT, () => console.log(`Listening on ${PORT}`));
server.listen(PORT, () => console.log(`Listening on ${PORT}`));
