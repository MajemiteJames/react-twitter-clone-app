const { db } = require('../util/admin');

firebaseConfig = require('../util/config');

const firebase = require('firebase');
firebase.initializeApp(firebaseConfig);

const { validateSignupData, validateLoginData } = require('../util/validators');

exports.signup = (request, response) => {
    const newUser = {
        email: request.body.email,
        password: request.body.password,
        confirmPassword: request.body.confirmPassword,
        handle: request.body.handle,
    }

    const { valid, errors } = validateSignupData(newUser);
    if(!valid) return response.status(400).json(errors);

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
    });

}

exports.login =  (request, response) => {
    const user = {
        email: request.body.email,
        password: request.body.password
    };

    const { valid, errors } = validateLoginData(user);
    if(!valid) return response.status(400).json(errors);

    firebase.auth().signInWithEmailAndPassword(user.email, user.password).then(data => {
        return data.user.getIdToken();
    }).then( token => {
        return response.json({token})
    }).catch( err => {
        console.error(err)
        if(err.code === "auth/wrong-password"){
            return response.status(403).json({general: 'Wrong credentails, please try again'});
        }else response.status(500).json({ error: err.code})
    })
}