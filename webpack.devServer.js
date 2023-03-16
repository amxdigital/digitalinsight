const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");
const https = require("https");
const express = require("express");
const bodyParser = require("body-parser");
const webpack = require("webpack");
const webpackDevMiddleware = require("webpack-dev-middleware");

// const buildFolder = `dist`;
const PORT = 3000;
// const HOST = `http${process.argv[2] === "https" ? "s" : ""}://localhost:${PORT}`;
// const PATH = `${HOST}/${buildFolder}`;
const env = {};
const options = { env, mode: "development" };

const { devServer, ...config } = require("./webpack.config.js")(env, options);
const app = express();
const compiler = webpack({ ...config, mode: options.mode });

function ensureDirectoryExistence(filePath) {
    var dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
}

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); // without this fonts/icons.woff call was restricted by CORS.
    res.header("Access-Control-Allow-Methods", "GET,POST");
    res.header("Access-Control-Allow-Headers", "X-Requested-With, Access-Control-Allow-Origin, Content-Type");
    next();
});

app.use(bodyParser.json());

app.use("/dist", express.static("dist"));

app.use(
    webpackDevMiddleware(compiler, {
        index: true,
        publicPath: config.output.publicPath
    })
);

app.use(
    require("webpack-hot-middleware")(compiler, {
        log: console.log,
        path: "/__webpack_hmr",
        heartbeat: 10 * 1000
    })
);

app.post("/update-stub/*", (req, res) => {
    var body = req.body;
    var urlArr = `${req.url}.res`.split("/");
    urlArr.shift();
    urlArr[0] = "stubs";
    var filePath = urlArr.join("/");
    ensureDirectoryExistence(filePath);
    fs.writeFile(filePath, JSON.stringify(body, null, "\t"));
    res.end();
});

app.all("/stubs/*", (req, res) => {
    const data = fs.readFileSync(`${req.url}.res`.slice(1)); // slice(1) to remove the first '/' readFile path doesn't work with path like '/abc/xyz'
    res.jsonp(JSON.parse(data.toString()));
});

// app.get("*", (req, res) => {
//     res.sendFile(path.join(__dirname, "dist/index.html"));
// });
app.use("*", (req, res, next) => {
    const filename = path.resolve(compiler.outputPath, "index.html"); // https://stackoverflow.com/a/47276710
    compiler.outputFileSystem.readFile(filename, (err, result) => {
        if (err) {
            return next(err);
        }
        res.set("content-type", "text/html");
        res.send(result);
        res.end();
    });
});

rimraf.sync("dist");

if (process.argv[2] === "https") {
    var certOptions = {
        key: fs.readFileSync(path.resolve("/WorkSpace/key.pem")),
        cert: fs.readFileSync(path.resolve("/WorkSpace/cert.pem"))
    };
    https.createServer(certOptions, app).listen(PORT, () => {
        console.log(`App listening on port ${PORT}!\n`);
    });
} else {
    app.listen(PORT, () => {
        console.log(`App listening on port ${PORT}!\n`);
    });
}
