const path = require('path') // gestion fichiers locaux
const express = require('express') //framework mvc
const nunjucks = require('nunjucks') // templates
const session = require('express-session') // sessions
const bodyParser = require('body-parser')
const mongoose = require('mongoose') //bdd
const fs = require('fs');
const json2csv = require('json2csv').parse; //permet de transformer en csv
const fields = ['label', 'dateBegin', 'dateEnd', 'priority', 'state', 'user']; //champs pour le csv
const jwt = require('jsonwebtoken'); //authentification
const bcrypt = require('bcrypt'); //crypte les mots de passes
const uniqueValidator = require('mongoose-unique-validator'); //permet d'ajouter une contrainte unique

var Schema= mongoose.Schema;

const config = require(path.join(__dirname, 'config.js'))

//Schema pour un objet utilisateur
const UserSchema = new mongoose.Schema({
  login: { type: String, required: true, unique:true},
  password: {type: String, required: true},
})

//Ajout d'une contrainte unique
UserSchema.plugin(uniqueValidator);

const User= mongoose.model('User', UserSchema);

//Schema pour un objet Todo. La ligne user en commentaire est normalement celle à utiliser mais je n'arrivais pas à régler un problème avec
const TodoSchema = new mongoose.Schema({
  label: { type: String, required: true },
  dateBegin: { type: String },
  dateEnd: { type: String },
  priority: { type: Number },
  user: { type: String},
  state: { type: String}
  //user: [{ type: Schema.Types.ObjectId, ref: "User"}]
})

// to fix all deprecation warnings
mongoose.set('useFindAndModify', false);
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
mongoose.set('useCreateIndex', true);

const Todo = mongoose.model('Todo', TodoSchema);

//on se connecte à la bdd
mongoose.connect('mongodb://' + config.mongodb.host + '/' + config.mongodb.db)
mongoose.connection.on('error', err => {
  console.error(err)
})

let app = express()

nunjucks.configure('views', {
  express: app
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

let sessionStore = new session.MemoryStore()

app.use(express.static(path.join(__dirname, '/views')))
app.use(session({
  cookie: { maxAge: 60000 },
  store: sessionStore,
  saveUninitialized: true,
  resave: 'true',
  secret: config.express.cookieSecret
}))

app.use((req, res, next) => {
  next()
})

let router = express.Router()

//Route de base permettant d'afficher les tâches
router.route('/')
  .get((req, res) => {
    //Si l'utilisateur est authentifié, on récupère son id à partir dutoken jwt et on affiche les taches de cet utilisateur uniquement
    if(req.query.token!==undefined)
    {
      const token = req.query.token;
      const decodedToken = jwt.verify(token, 'RANDOM_TOKEN_SECRET');
      const userId = decodedToken.userId;
      Todo.find({user: userId}).then(todos => {
        User.find().then(users=>{res.render('todo.njk', { todos: todos, users: users })})
      }).catch(err => {
        console.error(err)
      })
    }
    //sinon, on affiche simplement toutes les tâches
    else
    {
      Todo.find().then(todos => {
        User.find().then(users=>{res.render('todo.njk', { todos: todos, users: users })})
      }).catch(err => {
        console.error(err)
      })
    }
  })

  //Route permettant d'ajouter une nouvelle tache
router.route('/add')
  .post((req, res) => {
    new Todo({
      label: req.body.inputLabel,
      dateBegin: req.body.inputDateBegin,
      dateEnd: req.body.inputDateEnd,
      priority: req.body.inputPriority,
      user: req.body.inputUser,
      state: "todo"
    }).save().then(todo => {
      console.log('Votre tâche a été ajoutée');
      res.redirect('/todo')
    }).catch(err => {
      console.warn(err);
    })
  })

  //Route permettant de s'inscrire
  router.route('/sign')
  .post((req,res)=>{
    bcrypt.hash(req.body.inputPassword,5).then(hash=>{
      new User({
        login: req.body.inputLogin,
        password: hash,
      }).save().then(todo => {
        console.log('Votre utilisateur a été ajoutée');
        res.redirect('/todo');
      }).catch(err => {
        console.warn(err);
        res.redirect('/todo');
      })
    })
  })

  //Route permettant de modifier une tâche
router.route('/edit/:id')
  .get((req, res) => {
    Todo.findById(req.params.id).then(todo => {
      User.find().then(users=>{res.render('edit.njk', { todo: todo, users: users })})
    }).catch(err => {
      console.error(err)
    })
  })
  .post((req, res) => {
    Todo.findByIdAndUpdate({ _id: req.params.id }, {
      label: req.body.inputLabel,
      dateBegin: req.body.inputDateBegin,
      dateEnd: req.body.inputDateEnd,
      priority: req.body.inputPriority,
      user: req.body.inputUser,
    }).then(todo => {
      //@Todo

      todo.save().then(todo => {
        console.log('Votre tâche a été modifiée');
        res.redirect('/todo')
      }).catch(err => {
        console.error(err)
      })
    }).catch(err => {
      console.error(err)
    })
  })

  //Route permettant d'effacer toutes les tâches effectuées
router.route('/delete/all')
  .get((req, res) => {
    Todo.deleteMany({state:"done"}).then(todo=>{
      console.log('Vos taches ont été supprimées');
        res.redirect('/todo')
    }).catch(err => {
      console.error(err)
    })
  })

  //permet de récupérer la date d'aujourd'hui
let currentDate =new Date();
var dd = String(currentDate.getDate()).padStart(2, '0');
var mm = String(currentDate.getMonth() + 1).padStart(2, '0'); //January is 0!
var yyyy = currentDate.getFullYear();
currentDate= dd + '/' + mm + '/' + yyyy;

  //Route permettant de valider toutes les tâches
  router.route('/validate/all')
  .get((req, res) => {
    Todo.updateMany({state:"todo"}, {state:"done", dateEnd: currentDate}).then(todo=>{
      console.log('Vos taches ont été validées');
        res.redirect('/todo')
    }).catch(err => {
      console.error(err)
    })
  })

  //Route permettant de valider une tâche
router.route('/validate/:id')
  .get((req, res) => {
    Todo.findByIdAndUpdate({ _id: req.params.id },{state: "done", dateEnd: currentDate}).then(() => {
      console.log('Votre tâche est finie');
      res.redirect('/todo')
    }).catch(err => {
      console.error(err)
    })
  })

  //Route permettant de supprimer une tache effectuée
  router.route('/delete/:id')
  .get((req, res) => {
    Todo.findByIdAndRemove({ _id: req.params.id }).then(() => {
      console.log('Votre tâche est supprimée');
      res.redirect('/todo')
    }).catch(err => {
      console.error(err)
    })
  })

  //Route permettant de télécharger les tâches en fichier csv
  router.route('/convertcsv')
  .get((req,res)=>{
    Todo.find().then(todos=>{
      let csv;
      try {
        csv= json2csv(todos, {fields});
      } catch (err) {
        return res.status(500).json({ err });
      }
      currentDate= dd + '-' + mm + '-' + yyyy;
      const filePath = './public/export/'+currentDate+'.csv'
      fs.writeFile(filePath, csv, function (err) {
        if (err) {
          return res.json(err).status(500);
        }
      });
      console.log('Le fichier csv est sauvegardé');
      return res.redirect('/todo');
    }).catch(err => {
      console.error(err)
    })
  });

  //Route permettant de se connecter
  router.route('/login')
  .post((req,res)=>{
    User.findOne({ login: req.body.inputLogin })
    .then(user => {
      if (!user) {
        return res.status(401).json({ error: 'Utilisateur non trouvé !' });
      }
      bcrypt.compare(req.body.inputPassword, user.password)
        .then(valid => {
          if (!valid) {
            return res.status(401).json({ error: 'Mot de passe incorrect !' });
          }
          let token=jwt.sign(
              { userId: user._id },
              'RANDOM_TOKEN_SECRET',
              { expiresIn: '24h' }
            );
            //récupération du token dans l'url
          res.redirect('/todo?token='+token);
        })
        .catch(error => res.status(500).json({ error }));
    })
    .catch(error => res.status(500).json({ error }));
  })


app.use('/todo', router)
app.use('/pub', express.static('public'))
app.use((req, res) => {
  res.redirect('/todo')
})

app.listen(config.express.port, config.express.ip, () => {
  console.log('Server listening on ' + config.express.ip + ':' + config.express.port)
})
