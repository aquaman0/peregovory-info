const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
app.set("view engine", "ejs");
const io = require("socket.io")(server, {
  cors: {
    origin: '*'
  }
});
const { ExpressPeerServer } = require("peer");
const opinions = {
  debug: false,
};
const dotenv = require("dotenv").config();
const urlencodedParser = express.urlencoded({extended: false});
const port = process.env.PORT || 3030;

// Import the functions you need from the SDKs you need
const { initializeApp } = require("firebase/app");

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.FB_API_KEY,
  authDomain: process.env.FB_AUTH_DOMAIN,
  databaseURL: process.env.FB_DB_URL,
  projectId: process.env.FB_PROJECT_ID,
  storageBucket: process.env.FB_STORAGE_BUCKET,
  messagingSenderId: process.env.FB_MESSAGING_SENDER_ID,
  appId: process.env.FB_APP_ID,
  measurementId: process.env.FB_M_ID
};

// Initialize Firebase
const firebase = initializeApp(firebaseConfig);

const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword, updateEmail, EmailAuthProvider, reauthenticateWithCredential } = require("firebase/auth");
const { getDatabase, ref, set, child, get, update, onValue } = require("firebase/database");
const database = getDatabase(firebase);

app.use("/peerjs", ExpressPeerServer(server, opinions));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
  function getUserData(user, callback) {
    const userId = user.uid;
    const dbRef = ref(getDatabase());
    get(child(dbRef, `users/${userId}`)).then(async (snapshot) => {
      if (snapshot.exists()) {
        let data = await snapshot.val();
        callback(data);
      } else {
        let data = {};
        callback(data);
      }
    }).catch((error) => {
      console.error(error);
    });
  }

  async function checkUser() {
    const auth = getAuth();
    let user = await auth.currentUser;
    if (user) {
      console.log("MY ID: " + user.uid);
      getUserData(user, function(result) {
        res.render("home", {roomId: req.params.room, uid: user.uid, user_data: result});
      });
    } else {
      res.render("home", {roomId: req.params.room});
    }
  }
  checkUser();
});

app.get("/register", (req, res) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (user) {
    var userEmail = user.email;
    res.render("home", {email: userEmail});
  } else {
    res.render("register");
  }
});
app.post("/register", urlencodedParser, function (req, res) {
  try {
    function writeUserData(userId, name, email) {
      const db = getDatabase();
      set(ref(db, 'users/' + userId), {
        username: name,
        email: email,
        credits: 10,
        phone: 0,
        city: '',
      });
      console.log("User " + username + " signed in.");
    }

    const {email, username, password} = req.body;
    const auth = getAuth();
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in
        const user = userCredential.user;
        writeUserData(user.uid, username, email);
        res.redirect("/");
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        res.render("register", {errorreg: errorCode});
      });
  } catch(e) {
    console.log(e);
    res.redirect('/');
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});
app.post("/login",  urlencodedParser, function (req, res) {
  try {
    const {email, password} = req.body;
    const auth = getAuth();
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          // Signed in
          res.redirect('/');
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          res.render("register", {errorlog: errorCode});
        });
  } catch(e) {
    console.log(e);
    res.redirect('/register');
  }
});

app.post("/logout", (req, res) => {
  try {
    const auth = getAuth();
    signOut(auth).then(() => {
      res.redirect("/");
    }).catch((error) => {
      console.log(error.message);
    });
  } catch(e) {
    console.log(e);
    res.redirect('/');
  }
});


io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, userName) => {
    socket.join(roomId);
    setTimeout(()=>{
      socket.to(roomId).broadcast.emit("user-connected", userId);
    }, 1000)
    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message, userName);
    });
  });
});

server.listen(port, () => console.log(`Active on ${port} port`));
