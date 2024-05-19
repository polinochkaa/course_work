const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const bodyParser = require('body-parser');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/usermodel');
const Doclad = require("./models/docladmodel");
const multer = require('multer');
const flash = require('express-flash');
const fs = require('fs');
const mammoth = require('mammoth');

const app = express();
const host = '127.0.0.1';
const port = 7000;
app.use(express.static('./static'));
app.use(flash());

mongoose.connect('mongodb://127.0.0.1:27017/course-work', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB', error);
    });

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy((email, password, done) => {
    User.findOne({ email: email }, (err, user) => {
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        if (!user.verifyPassword(password)) { return done(null, false); }
        return done(null, user);
    });
}))








passport.serializeUser((user, done) => {
    done(null, user.id);
})

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});


function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    } else {
        return res.redirect('/login');
    }
}

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/mainpage.html');
});

app.get('/archive', (req, res) => {
    res.sendFile(__dirname + '/views/archive.html');
});

app.get('/komitet', (req, res) => {
    res.sendFile(__dirname + '/views/komitet.html');
});

app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/views/registration.html');
});

app.post('/register', (req, res) => {
    const {email, password} = req.body;

    // Проверяем, есть ли уже зарегистрированный пользователь с таким же email
    User.findOne({email})
        .then(existingUser => {
            if (existingUser) {
                // Если пользователь уже зарегистрирован, отправляем JSON-сообщение и прекращаем выполнение кода
                res.redirect('/login');
                return res.status(400).json({message: 'Пользователь с такими данными уже зарегистрирован'});
            }

            // Создаем нового пользователя
            const newUser = new User({email, password});

            // Сохраняем пользователя
            return newUser.save();

        })
        .then(savedUser => {
            console.log('Пользователь успешно сохранен:', savedUser);
            res.redirect('/login'); // Перенаправляем на страницу входа
        })
        .catch(error => {
            console.error('Ошибка при сохранении пользователя:', error);
            res.status(500).send('Ошибка при сохранении пользователя');
        });
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/views/login.html');
});

// app.post('/login', (req, res) => {
//     const email = req.body;
//     const user = User.find(email);
//     if (user.role == 'user'){
//         passport.authenticate('local', {
//             successRedirect: '/me',
//             failureRedirect: '/login',
//             failureFlash: true
//         })
//     }
//     else if (user.role == 'admin'){
//         passport.authenticate('local', {
//             successRedirect: '/admin',
//             failureRedirect: '/login',
//             failureFlash: true
//         })
//     }
//     else if (user.role == 'sectionhead'){
//         passport.authenticate('local', {
//             successRedirect: '/sectoinhead',
//             failureRedirect: '/login',
//             failureFlash: true
//         })
//     }
// });

app.post('/login', (req,res) => {
  res.redirect('/sectionhead');
});

app.post('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

app.get('/me',  (req, res) => {
    res.sendFile(__dirname + '/views/personalpage.html');
});

// app.get('/me',  (req, res) => {
//     user = User.find(req.session.userId)
//     if (req.isAuthenticated() && user.role == 'user') {
//         res.sendFile(__dirname + '/views/personalpage.html');
//     } else {
//         res.redirect('/login');
//     }
// });

// Настройка Multer для загрузки файлов
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        const {username, section, docladname} = req.body;
        const currentYear = new Date().getFullYear();
        cb(null, file.originalname);
        const filename = username + ' ' + docladname + ' ' + currentYear + 'docx';
    }
});
const upload = multer({ storage: storage });


app.post('/me', upload.single('file'), (req, res) =>{
    const {username, section, docladname} = req.body;
    const content = mammoth.extractRawText({ path: req.file.path });
    mammoth.extractRawText({ path: req.file.path })
        .then(result => {
            const content = result.value;
            const email = req.session.email;
            const newDoclad = new Doclad({ email, username, section, docladname, content });
            newDoclad.save()
                .then(() => res.redirect('/me'))
                .catch(err => res.status(500).send(err));
        })
        .catch(err => res.status(500).send(err));
});



app.get('/sectionhead',  (req, res) => {
    //res.sendFile(__dirname + '/views/sectionhead.html');
    const user = User.find(req.session.userId)
    res.redirect('/sectionhead/' + user.section);
});



app.get('/sectionhead/*',  (req, res) => {
    const user = User.find(req.session.userId)
    const section = user.section
    res.sendFile(__dirname + '/views/sectionhead.html');
});

// app.get('/sectionhead',  (req, res) => {
//     user = User.find(req.session.userId)
//     if (req.isAuthenticated() && user.role == 'sectionhead') {
//         res.sendFile(__dirname + '/views/sectionhead.html');
//     } else {
//         res.redirect('/login');
//     }
// });

app.get('/admin', async (req, res) => {
    const users = await User.find();
    res.sendFile(__dirname + '/views/admin.html');
});


app.listen(port, host, function () {
    console.log(`Server listens http://${host}:${port}`);
});


