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
const { getDatabase, ref, set, child, get, update } = require("firebase/database");
const database = getDatabase(firebase);

app.use("/peerjs", ExpressPeerServer(server, opinions));
app.use(express.static("public"));

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


app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
  async function checkUser() {
    const auth = getAuth();
    let user = await auth.currentUser;
    if (user) {
      const userId = user.uid;
      getUserData(user, function(result) {
        res.render("home", { roomId: req.params.room, uid: userId, user_data: result });
      })
    } else {
      res.render("home", { roomId: req.params.room });
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
    const {email, username, password} = req.body;
    const auth = getAuth();
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          // Signed in
          const user = userCredential.user;
          res.redirect("/");
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          res.render("register", {errorreg: errorCode});
        });
    onAuthStateChanged(auth, (user) => {
      if (user) {
        function writeUserData(userId, name, email) {
          const db = getDatabase();
          set(ref(db, 'users/' + userId), {
            username: name,
            email: email,
            credits: 10,
            phone: 0,
            city: '',
          });
          console.log("User" + username + "signed in.");
        }
        writeUserData(user.uid, username, email);
      } else {
        console.log("No user is signed in.");
      }
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
          const user = userCredential.user;
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

app.get("/logout", function(req , res){
  const auth = getAuth();
  signOut(auth).then(() => {
    res.redirect("/");
  }).catch((error) => {
    //...
  });
});

app.get("/account", function (req, res) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (user) {
    getUserData(user, function(result) {
      res.render("account", {data: result});
    })
  } else {
    res.render("register");
  }
});
app.post("/account",  urlencodedParser, function (req, res) {
  const {email, username, oldpassword, newpassword, phone, city} = req.body;
  async function updateUserInfo (email, username, oldpassword, newpassword, phone, city) {
    const db = getDatabase();
    const auth = getAuth();
    let user = await auth.currentUser;
    var credential = EmailAuthProvider.credential(
        user.email,
        oldpassword
    );
    reauthenticateWithCredential(user, credential).then(async function () {
      const updates = {};
      updates['/users/' + user.uid + '/username'] = username;
      updates['/users/' + user.uid + '/email'] = email;
      updates['/users/' + user.uid + '/phone'] = phone;
      updates['/users/' + user.uid + '/city'] = city;
      updateEmail(user, email).then(() => {
        updatePassword(user, newpassword).then(() => {
          console.log();
        }).catch((error) => {
          console.log(error);
        });
      }).catch((error) => {
        console.log(error);
      });
      await update(ref(db), updates);
      res.redirect("/account");
    }).catch(function(error) {
      console.log(error.code);
      res.redirect("/account");
    });
  }
  updateUserInfo(email, username, oldpassword, newpassword, phone, city);
});

app.get("/chat", (req, res) => {
  async function checkUser() {
    const auth = getAuth();
    let user = await auth.currentUser;
    if (user) {
      res.redirect(`/chat-${uuidv4()}`);
    } else {
      res.render("register", {errorreg: 'Пожалуйста зарегистрируйтесь или войдите.'});
    }
  }
  checkUser();
});

app.get("/chat-:room", (req, res) => {
  async function checkUser() {
    const auth = getAuth();
    let user = await auth.currentUser;
    if (user) {
      res.render("room", { roomId: req.params.room });
    } else {
      res.render("register", {errorreg: 'Пожалуйста зарегистрируйтесь или войдите.'});
    }
  }
  checkUser();
});


app.get("/conference", (req, res) => {
  async function checkUser() {
    const auth = getAuth();
    let user = await auth.currentUser;
    if (user) {
      res.redirect(`/conference-${uuidv4()}`);
    } else {
      res.render("register", {errorreg: 'Пожалуйста зарегистрируйтесь или войдите.'});
    }
  }
  checkUser();
});
app.get("/conference-:room", (req, res) => {
  async function checkUser() {
    const auth = getAuth();
    let user = await auth.currentUser;
    if (user) {
      getUserData(user, function(result) {
        res.render("confa", { roomId: req.params.room, username: result.username });
      });
    } else {
      res.render("register", {errorreg: 'Пожалуйста зарегистрируйтесь или войдите.'});
    }
  }
  checkUser();
});

const users = {};
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

  console.log('a user connected');

  socket.on("login", function(data){
    console.log('a user ' + data.uid + ' connected');
    // saving userId to object with socket ID
    users[socket.id] = { roomid: data.roomId, uid: data.uid, uname: data.user_name };
    console.log(users);
    socket.emit("online-login", { data: users[socket.id] });
  });

  socket.on("disconnect", function(){
    console.log('user ' + users[socket.id] + ' disconnected');
    socket.emit("online-disconnect", { data: users[socket.id] });
    // remove saved socket from users object
    delete users[socket.id];
  });

});

server.listen(port, () => console.log(`Active on ${port} port`));
