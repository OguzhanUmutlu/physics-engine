(async function () {
    const isWeb = typeof window === "object" && typeof require === "undefined";
    const _global = isWeb ? window : global;
    const _exports = isWeb ? window : module.exports;
    let _p;
    _exports.Phygic = new Promise(r => _p = r);
    const Collider2D = isWeb ? await (async function () {
        if (typeof window.Collider2D !== "undefined") return Collider2D;
        const script = document.createElement("script");
        script.src = "./collider2d.js";
        document.body.appendChild(script)
        await new Promise(r => script.onload = r);
        return window.Collider2D;
    })() : require("collider2d");
    let _requestAnimationFrame = f => {
        if (isWeb) return requestAnimationFrame(f);
        process.nextTick(f);
    };
    let _cancelAnimationFrame = f => {
        if (isWeb) cancelAnimationFrame(f);
    };
    const collider = new Collider2D.Collider2D();
    const {PI, floor, ceil, round, sqrt, pow, sin, cos, tan, abs} = Math;

    function extendClass(self, extend) {
        Object.keys(extend.prototype).forEach(f => self.prototype[f] = extend.prototype[f]);
    }

    function Vector2(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    Vector2.prototype.add = function (vec) {
        return new Vector2(this.x + vec.x, this.y + vec.y);
    };
    Vector2.prototype.sub = function (vec) {
        return new Vector2(this.x - vec.x, this.y - vec.y);
    };
    Vector2.prototype.mul = function (vec) {
        return new Vector2(this.x * vec.x, this.y * vec.y);
    };
    Vector2.prototype.div = function (vec) {
        return new Vector2(this.x / vec.x, this.y / vec.y);
    };
    Vector2.prototype.scale = function (number) {
        return new Vector2(this.x * number, this.y * number);
    };
    Vector2.prototype.floor = function () {
        return new Vector2(floor(this.x), floor(this.y));
    };
    Vector2.prototype.ceil = function () {
        return new Vector2(ceil(this.x), ceil(this.y));
    };
    Vector2.prototype.round = function () {
        return new Vector2(round(this.x), round(this.y));
    };
    Vector2.prototype.len = function () {
        return sqrt(this.x ** 2 + this.y ** 2);
    };
    Vector2.prototype.dist = function (vec) {
        return this.sub(vec).len();
    };
    Vector2.prototype.equals = function (vec) {
        return vec.x === this.x && vec.y === this.y;
    };
    Vector2.prototype.set = function (vec) {
        this.x = vec.x;
        this.y = vec.y;
    };
    Vector2.prototype.clone = function () {
        return new Vector2(this.x, this.y);
    };

    Vector2.zero = () => new Vector2;

    function Circle(radius) {
        this.radius = radius;
        this.fill = "#000000";
        this.stroke = "";
        this.type = "circle";
    }

    Circle.prototype.draw = function (world, tile) {
        const ctx = world.ctx;
        ctx.save();
        ctx.fillStyle = this.fill;
        ctx.strokeStyle = this.stroke;
        ctx.beginPath();
        ctx.arc(tile.x, tile.y, this.radius, 0, PI * 2);
        if (this.fill) ctx.fill();
        if (this.stroke) ctx.stroke();
        ctx.closePath();
        ctx.restore();
    };

    function Polygon(path) {
        this.fill = "#000000";
        this.stroke = "";
        this.type = "polygon";
        Object.defineProperty(this, "path", {
            get: () => path,
            set: v => {
                path = v;
                this._hasChanged = true;
            }
        })
    }

    Polygon.prototype.draw = function (world, tile) {
        const ctx = world.ctx;
        ctx.save();
        ctx.fillStyle = this.fill;
        ctx.strokeStyle = this.stroke;
        /*ctx.translate(tile.x, tile.y);
        ctx.rotate(-tile.rotation);
        ctx.translate(-tile.x, -tile.y);*/
        if (this._lastRotation !== tile.rotation || this._hasChanged) {
            this._lastRotation = tile.rotation;
            this._hasChanged = false;
            this._lastPoints = this.path.map(i => {
                const x = i[0];
                const y = i[1];
                return [
                    x * cos(tile.rotation) + y * sin(tile.rotation),
                    -x * sin(tile.rotation) + y * cos(tile.rotation)
                ];
            });
        }
        ctx.beginPath();
        (this._lastPoints || this.path).forEach((i, j) => ctx[j === 0 ? "moveTo" : "lineTo"](tile.x + i[0], tile.y + i[1]));
        if (this.fill) ctx.fill();
        if (this.stroke) ctx.stroke();
        ctx.closePath();
        ctx.fillStyle = "#00ff00";
        this._lastPoints.forEach(i => ctx.fillRect(tile.x + i[0] - 2, tile.y + i[1] - 2, 4, 4));
        ctx.fillRect(tile.x - 2, tile.y - 2, 4, 4);
        ctx.restore();
    };

    function Rectangle(width, height) {
        this.fill = "#000000";
        this.stroke = "";
        this.setSize(width, height);
        this.type = "rectangle";
        Object.defineProperties(this, {
            width: {
                get: () => width,
                set: v => {
                    width = v;
                    this.setSize(width, height);
                }
            },
            height: {
                get: () => height,
                set: v => {
                    height = v;
                    this.setSize(width, height);
                }
            }
        })
    }

    Rectangle.prototype.setSize = function (width, height) {
        this.width = width;
        this.height = height;
        this.path = [
            [-width / 2, -height / 2],
            [width / 2, -height / 2],
            [width / 2, height / 2],
            [-width / 2, height / 2]
        ];
    };

    function Tile(x = 0, y = 0, opts) {
        Vector2.apply(this, arguments);
        if (!opts || typeof opts !== "object" || Array.isArray(opts)) opts = {};
        const def = {
            shape: null, rotation: 0, gravityEnabled: true, world: null, mass: 1
        };
        Object.keys(def).forEach(i => !Object.keys(opts).includes(i) && (opts[i] = def[i]));
        this.shape = opts.shape;
        this.rotation = opts.rotation;
        this.rotationTarget = opts.rotation;
        this.velocity = Vector2.zero();
        this.force = Vector2.zero();
        this.motion = Vector2.zero();
        this.mass = opts.mass;
        this.gravityEnabled = opts.gravityEnabled;
        this.dragCoefficient = 1;
        if (opts.world instanceof World) opts.world.addTile(this);
        this.initOptions = opts;
        Object.freeze(this.initOptions);
    }

    Tile.prototype.getBottomArea = function () {
        switch (this.shape?.type) {
            case "polygon":
            case "rectangle":
                const a = this.shape.path.map(i => i[0]);
                const w = a.sort((a, b) => b - a)[0] - a.sort((a, b) => a - b)[0];
                const b = this.shape.path.map(i => i[1]);
                const h = b.sort((a, b) => b - a)[0] - b.sort((a, b) => a - b)[0];
                return w * h;
            case "circle":// TODO: improvements
                return PI * this.shape.radius;
        }
    };
    Tile.prototype.setShape = function (shape) {
        this.shape = shape;
    };
    Tile.prototype.getDirection = function () {
        return new Vector2(cos(this.rotation), -sin(this.rotation));
    };
    Tile.prototype.getCollider = function () {
        const angle = t => {
            t.setAngle(this.rotation);
            return t;
        };
        switch (this.shape?.type) {
            case "circle":
                return ["circle", angle(new Collider2D.Circle(new Collider2D.Vector(this.x, this.y), this.shape.radius))];
            case "polygon":
            case "rectangle":
                return ["polygon", angle(new Collider2D.Polygon(new Collider2D.Vector(this.x, this.y), (this.shape._lastPoints || this.shape.path).map(i => new Collider2D.Vector(...i))))];
            default:
                return null;
        }
    };
    Tile.prototype.collidesWith = function (tile, details = false) {
        const c = t => {
            if (t instanceof Collider2D.Circle) return ["circle", t];
            if (t instanceof Collider2D.Polygon) return ["polygon", t];
            return (t.getCollider ? t.getCollider() : null) || ["point", new Collider2D.Vector(t.x, t.y)]
        };
        const A = c(this);
        const B = c(tile);
        switch (A[0]) {
            case "circle":
                switch (B[0]) {
                    case "circle":
                        return collider.testCircleCircle(A[1], B[1], details);
                    case "polygon":
                        return collider.testPolygonCircle(B[1], A[1], details);
                    case "point":
                        return collider.pointInCircle(B[1], A[1], details);
                    default:
                        return false;
                }
            case "polygon":
                switch (B[0]) {
                    case "circle":
                        return collider.testPolygonCircle(A[1], B[1], details);
                    case "polygon":
                        return collider.testPolygonPolygon(A[1], B[1], details);
                    case "point":
                        return collider.pointInPolygon(B[1], A[1], details);
                    default:
                        return false;
                }
            case "point":
                switch (B[0]) {
                    case "circle":
                        return collider.pointInCircle(A[1], B[1], details);
                    case "polygon":
                        return collider.pointInPolygon(A[1], B[1], details);
                    case "point":
                        return this.equals(tile);
                    default:
                        return false;
                }
            default:
                return false;
        }
    };
    Tile.prototype.move = function (world, vec, f = null) {
        this.set(this.add(vec));
        const collision = Array.from(world.tiles).find(i => i !== this && i.collidesWith(this));
        if (collision) {
            if (collision.shape && collision.shape.type === "polygon") {
                const nearest = collision.shape.path.map((i, j) => {
                    const next = collision.shape.path[collision.shape.path.length === j + 1 ? 0 : j + 1];
                    return new Collider2D.Polygon(new Collider2D.Vector(collision.x, collision.y), [
                        new Collider2D.Vector(i[0], i[1]),
                        new Collider2D.Vector(next[0], next[1])
                    ]);
                }).filter(i => this.collidesWith(i)).map(i => {
                    const from = {x: i.points[0].x + collision.x, y: i.points[0].y + collision.y};
                    const to = {x: i.points[1].x + collision.x, y: i.points[1].y + collision.y};
                    // https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line#Line%20defined%20by%20an%20equation
                    const a = (to.y - from.y) / (to.x - from.x);
                    const b = -1;
                    const c = from.y - a * from.x;
                    const x0 = this.x;
                    const y0 = this.y;
                    const dist = abs(a * x0 + b * y0 + c) / sqrt(a ** 2 + b ** 2);
                    return [a, dist];
                }).sort((a, b) => a[1] - b[1])[0];
                if (nearest) {
                    this.rotationTarget = -Math.atan(nearest[0]);
                    if (this.rotationTarget === 90) this.rotationTarget = 0;
                }
            }
            this.set(this.sub(vec));
            return false;
        }
        return true;
    };
    Tile.prototype.update = function (world, deltaTime) {
        if (!deltaTime) return;
        this.velocity.set(this.velocity.add(this.force));
        const terminalVelocity = sqrt(2 * this.mass * world.gravityAcceleration / (world.fluidDensity * this.getBottomArea() * this.dragCoefficient));
        if (this.gravityEnabled) this.velocity.y += this.mass * world.gravityAcceleration / deltaTime;
        //if (this.velocity.y > terminalVelocity) this.velocity.y = terminalVelocity;
        if (!this.move(world, {x: this.velocity.x, y: 0})) this.velocity.x /= 2;
        if (!this.move(world, {x: 0, y: this.velocity.y})) this.velocity.y /= 2;
        if (this.move(world, {x: this.motion.x, y: this.motion.y})) this.motion.set(this.motion.scale(9 / 10))
        this.rotation += (this.rotationTarget - this.rotation) / 5;
    };

    const worlds = {};
    let _w_id = 0;

    function World(canvas, ctx) {
        this.tiles = new Set;
        this.canvas = canvas;
        this.ctx = canvas.getContext ? canvas.getContext("2d") : ctx;
        this.gravityAcceleration = 2; // px / second
        this.fluidDensity = 1.225;
        const id = _w_id++;
        worlds[id] = this;
        Object.defineProperty(this, "id", {
            get: () => id
        });
        this.update = function () {
            const self = worlds[id];
            self.tiles.forEach(function (tile) {
                tile.update(self, tile.lastUpdate ? Date.now() - tile.lastUpdate : 0);
                tile.lastUpdate = Date.now();
            });
        };
        this.render = function () {
            const self = worlds[id];
            self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
            self.tiles.forEach(function (tile) {
                if (tile.shape) tile.shape.draw(self, tile);
            });
        };
    }

    World.getById = function (id) {
        return worlds[id];
    };
    World.prototype.addTile = function (tile) {
        this.tiles.add(tile);
    };
    World.prototype.removeTile = function (tile) {
        this.tiles.delete(tile);
    };

    function Animator(...fn) {
        if (fn.length > 1) return fn.map(fn => Animator(fn));
        fn = fn[0];
        if (!Array.isArray(fn)) fn = [fn];
        fn = new Set(fn);
        let frameId = null;
        let timeScale = 1.0;
        const animate = async (repeat = true) => {
            fn.forEach(i => i());
            if (timeScale <= 1) {
                for (let i = 0; i < 1 / timeScale; i++) await new Promise(r => frameId = _requestAnimationFrame(r));
            } else {
                for (let i = 0; i < timeScale; i++) await new Promise(r => setTimeout(async () => {
                    await animate(false);
                    r();
                }));
            }
            if (repeat) await animate();
        };
        animate();
        return {
            getFrameId: () => frameId,
            stop: () => _cancelAnimationFrame(frameId),
            start: () => {
                _cancelAnimationFrame(frameId);
                animate();
            },
            setTimeScale: v => timeScale = v,
            getTimeScale: () => timeScale,
            addCallback: cb => fn.add(cb),
            removeCallback: cb => fn.delete(cb)
        };
    }

    const canvasResizeList = new Map;

    function CanvasResizer(canvas, width = 1.0, height = 1.0) {
        if (!isWeb) throw new Error("You can't use CanvasResizer method on a non-web platform.");
        canvas.width = window.innerWidth * width;
        canvas.height = window.innerHeight * height;
        const fn = new Set;
        canvasResizeList.set(canvas, [width, height, fn]);
        return {remove: () => canvasResizeList.delete(canvas), addCallback: cb => fn.add(cb)};
    }

    if (isWeb) addEventListener("resize", () => {
        canvasResizeList.forEach((info, canvas) => {
            canvas.width = window.innerWidth * info[0];
            canvas.height = window.innerHeight * info[1];
            info[2].forEach(i => i());
        });
    });

    function centerCanvas(canvas) {
        if (!isWeb) throw new Error("You can't use centerCanvas method on a non-web platform.");
        canvas.style.position = "absolute";
        canvas.style.left = "50%";
        canvas.style.top = "50%";
        canvas.style.transform = "translate(-50%, -50%)";
        return {
            remove: () => {
                canvas.style.position = "";
                canvas.style.left = "";
                canvas.style.top = "";
                canvas.style.transform = "";
            }
        };
    }

    function MouseConstraint(world) {
        if (!isWeb) throw new Error("You can't use MouseConstraint method on a non-web platform.");
        if (!world) return console.warn("No world was given for MouseConstraint.");
        const el = world.canvas;
        const listeners = [];
        const l = (e, n, f) => {
            listeners.push(e, n, f);
            e.addEventListener(n, f);
        };
        let down = false;
        let draggingTile = null;
        let draggingGravity = null;
        l(el, "mousedown", ev => {
            down = true;
            const vec = new Vector2(ev.clientX, ev.clientY);
            const tiles = Array.from(world.tiles);
            let tile;
            for (let i = 0; i < tiles.length; i++) {
                const t = tiles[i];
                if (t.collidesWith(vec)) {
                    tile = t;
                    break;
                }
            }
            if (tile) {
                draggingTile = tile;
                draggingGravity = tile.gravityEnabled;
                tile.gravityEnabled = false;
            }
        });
        l(el, "mousemove", ev => {
            if (!down || !draggingTile) return;
            const vec = new Vector2(ev.clientX, ev.clientY);
            draggingTile.set(vec);
            draggingTile.velocity.set(Vector2.zero());
        });
        l(el, "mouseup", () => {
            down = false;
            if (draggingTile) draggingTile.gravityEnabled = draggingGravity;
            draggingTile = null;
        });
        l(window, "blur", () => {
            down = false;
            if (draggingTile) draggingTile.gravityEnabled = draggingGravity;
            draggingTile = null;
        });
        return {remove: () => listeners.forEach(i => i[0].removeEventListener(...i.slice(1)))};
    }

    extendClass(Rectangle, Polygon);
    extendClass(Tile, Vector2);

    _exports.Phygic = {
        Vector2,
        Shapes: {Circle, Polygon, Rectangle},
        Tile,
        World,
        Utils: {Animator, CanvasResizer, centerCanvas, MouseConstraint}
    };
    _p(_exports.Phygic);
})();