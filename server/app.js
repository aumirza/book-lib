const express = require('express')
const createError = require('http-errors')
const morgan = require('morgan')
const cors = require('cors')
const router = require('./routes')

// Initialise app
const app = express()

// Middlewares
app.use(morgan('dev')) // logger
app.use(express.json()) //Json parser
app.use(cors())

// Attaching routers
app.use('/', router)

// catch 404 and create a error
app.use(function (req, res, next) {
    next(createError(404))
});

// error handler
app.use(
    (err, req, res, next) => {
        // set locals, only providing error in development
        res.locals.message = err.message
        res.locals.error = req.app.get('env') === 'development' ? err : {}

        // return the error 
        res.status(err.status || 500)
            .json({ error: err.message })
    }
)

// Serve static assets if in production
if (process.env.NODE_ENV === "production") {
    // Set static folder
    app.use(express.static("client/build"));

    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
    });
}

module.exports = app