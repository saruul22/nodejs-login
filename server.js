if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config()
}

const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const db = require('./db');

const initializePassport = require('./passport-config');
const { resolve } = require('path');
const { rejects } = require('assert');
// initializePassport(
//     passport,
//     email => users.find(user => user.email === email),
//     id => users.find(user => user.id === id)
// );

const users = [];

app.set('view-engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));
app.use(express.static('public'));

app.get('/', checkAuthenticated, (req, res) => {
    res.render('index.ejs', { name: req.user.name });
});

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs');
});

app.post('/login', checkNotAuthenticated, (req, res, next) => {
    if (!req.body.email || !req.body.password) {
        req.flash('error', 'All fields are required');
        return res.redirect('/login');
    }
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true
    })(req, res, next);
});



initializePassport(
    passport,
    async (email) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
                if (err) {
                    console.error('Error fetching user by email:', err.message);
                    return reject(err);
                }
                console.log('Fetched user by email:', row); // Debugging log
                resolve(row);
            });
        });
    },
    async (id) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
                if (err) {
                    console.error('Error fetching user by id:', err.message);
                    return reject(err);
                }
                console.log('Fetched user by ID:', row); // Debugging log
                resolve(row);
            });
        });
    }
);


app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs');
});

app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
        if (!req.body.name || !req.body.email || !req.body.password) {
            req.flash('error', 'All fields are required');
            return res.redirect('/register');
        }
        
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const id = Date.now().toString();

        console.log({ id, name: req.body.name, email: req.body.email, password: hashedPassword });

        // Validate email uniqueness
        db.get('SELECT * FROM users WHERE email = ?', [req.body.email], (err, row) => {
            if (err) {
                console.error('Error querying database:', err.message);
                return res.redirect('/register');
            }

            if (row) {
                console.error('Email already exists');
                req.flash('error', 'Email already in use');
                return res.redirect('/register');
            }

            const query = `INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)`;
            db.run(query, [id, req.body.name, req.body.email, hashedPassword], (err) => {
                if (err) {
                    console.error('Error inserting user:', err.message);
                    return res.redirect('/register');
                }
                res.redirect('/login');
            });
        });
    } catch (err) {
        console.error('Error hashing password:', err.message);
        res.redirect('/register');
    }
});

app.delete('/logout', (req, res, next) => {
    console.log('Logout route hit');
    req.logOut(err => {
        if (err) return next(err);
        res.redirect('/login');
    });
});


function checkAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }

    res.redirect('/login');
}

function checkNotAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return res.redirect('/');
    }
    next();
}

app.listen(3000);