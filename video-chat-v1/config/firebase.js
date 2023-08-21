// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyDUaI9sXXQUKZ6HjLP1CEOrQ9DPH0_LrAo",
    authDomain: "sistemapi-b6e9f.firebaseapp.com",
    databaseURL: "https://sistemapi-b6e9f-default-rtdb.firebaseio.com",
    projectId: "sistemapi-b6e9f",
    storageBucket: "sistemapi-b6e9f.appspot.com",
    messagingSenderId: "50369185280",
    appId: "1:50369185280:web:ddd1bb1a1028dfd5363ae5",
    measurementId: "G-BFLX5WWZFY"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
function signInUsers(){
    var email = document.getElementById('email').value;
    var pass = document.getElementById('password').value;
    firebase.auth().signInWithEmailAndPassword(email, pass)
        .catch(function(error) {
            // Handle Errors here.
            let errorCode = error.code;
            let errorMessage = error.MESSAGE;
            console.log(errorCode);
            console.log(errorMessage);
        });
}
//check if user is logged in or not
function checkIfLogedIn(){
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) { // if the user is logged in
            console.log(user)
            var emailv = user.email;
            console.log("User is signed in. with email: "+ emailv);
            document.getElementById('loginButton').setAttribute('style','display: none;visibility: hidden;');
            document.getElementById('logoutButton').setAttribute('style','display: inline-block;visibility: visible;')
        } else { // if the user is not logged in
            console.log("No user is signed in.");
            document.getElementById('loginButton').setAttribute('style','display: none;visibility: visible;');
            document.getElementById('logoutButton').setAttribute('style','display: inline-block;visibility: hidden;')
        }
    });
}

window.onload=function(){
    checkIfLogedIn()
};
function logout(){
    firebase.auth().signOut();
    checkIfLogedIn()
};