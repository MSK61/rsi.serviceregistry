"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@rsi/core");
var bodyParser = require("body-parser");
var compression = require("compression");
var cors = require("cors");
var express = require("express");
var http = require("http");
var uuid = require("uuid");
// create server and listen on provided port (on all network interfaces).
var ServiceRegistry = /** @class */ (function () {
    function ServiceRegistry(port, _BASEURI) {
        if (_BASEURI === void 0) { _BASEURI = "/"; }
        var _this = this;
        this._BASEURI = _BASEURI;
        this.services = [];
        this.serviceMap = {};
        /**
         * Event listener for HTTP server "listening" event.
         */
        this.onListening = function () {
            var addr = _this.server.address();
            var bind = typeof addr === "string"
                ? "pipe " + addr
                : "port " + addr.port;
            console.log("Service Registry Listening on " + bind);
        };
        /**
         * Shutdown the server
         */
        this.close = function () {
            _this.server.close();
            _this.app = null;
        };
        this.port = port;
        this.logger = core_1.RsiLogger.getInstance().getLogger("general");
        this.app = express();
        var whitelist = ["127.0.0.1", "localhost"];
        var corsOpts = {
            origin: function (origin, callback) {
                if (1 || typeof (origin) === "undefined") {
                    // @TODO: find an actual solution for https://github.com/wzr1337/viwiServer/issues/31
                    /**
                     * The origin may be hidden if the user comes from an ssl encrypted website.
                     *
                     * Also: Some browser extensions remove origin and referer from the http-request headers,
                     * and therefore the origin property will be empty.
                     */
                    callback(null, true);
                }
                else {
                    // subdomains and tlds need to be whitelisted explicitly
                    var hostRegex = new RegExp("(https?://)([^:^/]*)(:\\d*)?(.*)?", "gi");
                    var result = hostRegex.exec(origin);
                    var host = (result && result.length >= 2) ? result[2] : undefined;
                    var originIsWhitelisted = whitelist.indexOf(host) !== -1;
                    callback(originIsWhitelisted ? null : new Error("Bad Request"), originIsWhitelisted);
                }
            },
            exposedHeaders: "Location"
        };
        this.app.use(cors(corsOpts));
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.app.use(compression());
        // Get port from environment and store in Express.
        this.port = this.normalizePort(port);
        this.app.set("port", this.port);
        this.app.put("/", function (req, res, next) {
            var service = req.body;
            service.id = uuid.v4();
            var availableService = _this.services.find(function (s) {
                return s.name === service.name;
            });
            if (availableService) {
                var i = _this.services.indexOf(availableService);
                _this.services.splice(i, 1);
            }
            _this.services.push(service);
            _this.serviceMap[service.name] = service;
            res.header({ Location: "/" + service.id });
            res.json({
                status: "ok"
            });
        });
        this.app.get("/", function (req, res, next) {
            var data = _this.services.map(function (service) {
                return {
                    id: service.id,
                    name: service.name,
                    uri: "http://localhost:" + service.port + "/" + service.name + "/"
                };
            });
            res.json({
                data: data
            });
        });
        this.app.get("/:service/:collection", function (req, res, next) {
            if (_this.serviceMap.hasOwnProperty(req.params.service)) {
                var service = _this.serviceMap[req.params.service];
                var r = req;
                var redirectUrl = "http://localhost:" + service.port + "/"
                    + service.name + "/" + req.params.collection;
                if (r._parsedUrl.query) {
                    redirectUrl += "?" + r._parsedUrl.query;
                }
                res.redirect(redirectUrl);
            }
        });
        this.app.get("/:service/:collection/?:resource", function (req, res, next) {
            if (_this.serviceMap.hasOwnProperty(req.params.service)) {
                var service = _this.serviceMap[req.params.service];
                var redirectUrl = "http://localhost:" + service.port + "/"
                    + service.name + "/" + req.params.collection + "/" + req.params.resource;
                var r = req;
                if (r._parsedUrl.query) {
                    redirectUrl += "?" + r._parsedUrl.query;
                }
                res.redirect(redirectUrl);
            }
        });
        this.app.delete("/:service/:collection/?:resource", function (req, res, next) {
            if (_this.serviceMap.hasOwnProperty(req.params.service)) {
                var service = _this.serviceMap[req.params.service];
                var redirectUrl = "http://localhost:" + service.port + "/"
                    + service.name + "/" + req.params.collection + "/" + req.params.resource;
                var r = req;
                if (r._parsedUrl.query) {
                    redirectUrl += "?" + r._parsedUrl.query;
                }
                res.redirect(redirectUrl);
            }
        });
        this.app.get("/:service/", function (req, res, next) {
            if (_this.serviceMap.hasOwnProperty(req.params.service)) {
                var service = _this.serviceMap[req.params.service];
                res.redirect("http://localhost:" + service.port + "/" + service.name + "/");
            }
        });
        this.server = http.createServer(this.app);
    }
    ServiceRegistry.prototype.init = function () {
        this.server.listen(this.port);
        this.server.on("listening", this.onListening);
    };
    /**
     * Normalize a port into a number, string, or false.
     */
    ServiceRegistry.prototype.normalizePort = function (val) {
        var port = parseInt(val, 10);
        if (isNaN(port)) {
            // named pipe
            return val;
        }
        if (port >= 0) {
            // port number
            return port;
        }
        return false;
    };
    return ServiceRegistry;
}());
exports.ServiceRegistry = ServiceRegistry;
//# sourceMappingURL=service.registry.js.map