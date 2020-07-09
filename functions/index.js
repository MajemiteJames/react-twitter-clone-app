const functions = require('firebase-functions');
const admin = require('firebase-admin');
const app = require('express')();

admin.initializeApp();

const firebaseConfig = {
    apiKey: "AIzaSyCfVOks0FFEKqzvISYWQjN4QsnwCeRCVM4",
    authDomain: "social-app-1b93f.firebaseapp.com",
    databaseURL: "https://social-app-1b93f.firebaseio.com",
    projectId: "social-app-1b93f",
    storageBucket: "social-app-1b93f.appspot.com",
    messagingSenderId: "1097110146606",
    appId: "1:1097110146606:web:beb72e8d286c0d99e799bf",
    measurementId: "G-PXRVSRL33X"
  };



const firebase = require('firebase');
firebase.initializeApp(firebaseConfig);

const db = admin.firestore();

app.get('/screams', (request, response) => {
    db.collection('screams').orderBy('createdAt', 'desc').get()
    .then(data => {
        let screams = [];
        data.forEach(doc => {
            screams.push({
                screamId: doc.id,
                body: doc.data().body,
                userHandle: doc.data().userHandle,
                createdAt: doc.data().createdAt
            });
        });

        return response.json(screams)
    })
    .catch(err => console.error(err))
});

app.post('/scream',(request, response) => {

    const newScream = {
        body: request.body.body,
        userHandle: request.body.userHandle,
        createdAt: new Date().toISOString()
    };

    db.collection('screams').add(newScream).then( doc => {
       return response.json({ message: `document ${doc.id} created successfully`})
    })
    .catch( err => {
        response.status(500).json({ error: 'something went wrong'})
        console.error(err);
    })
})

// signup route
app.post('/signup', (request, response) => {
    const newUser = {
        email: request.body.email,
        password: request.body.password,
        confirmPassword: request.body.confirmPassword,
        handle: request.body.handle,
    }

    // validate data

    let newToken, userId;
    db.doc(`/users/${newUser.handle}`).get().then(doc => {
        if(doc.exists){
            return response.status(400).json({ handle: `this handle is already taken`})
        }else {
           return  firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
        }
    }).then(data => {
        userId = data.user.uid;
        return data.user.getIdToken();
    }).then(token => {
        newToken = token;
        const userCredentials = {
            handle: newUser.handle,
            email: newUser.email,
            createdAt: new Date().toISOString(),
            userId
        };

        return db.doc(`/users/${newUser.handle}`).set(userCredentials)
    }).then( () => {
        return response.status(201).json({ newToken })
    }).catch( err => {
        console.error(err);
        if(err.code === "auth/email-already-in-use"){
            response.status(400).json({ email: 'Email is already in use'})
        }else{

            response.status(500).json({ error: err.code})
        }
    })

})


exports.api = functions.https.onRequest(app);