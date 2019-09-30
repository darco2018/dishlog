const createError = require('http-errors');
const express = require('express');

const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const bodyParser = require('body-parser');
// routes
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const moviesRouter = require('./routes/movies');
const campgroundsRouter = require('./routes/campgrounds');
// const catsRouter = require('./routes/cats');

/* ---------- SEED DB start -------------*/
const seedDb = require('./seeds');

seedDb();
/* ---------- SEED DB end -------------*/

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // vs urlencoded for body-parser?!
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// move to routers?
app.use(bodyParser.urlencoded({ extended: 'true' })); // const requestBodyStr = JSON.stringify(req.body);

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/movies', moviesRouter);
app.use('/campgrounds', campgroundsRouter);
// app.use('/cats', catsRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
