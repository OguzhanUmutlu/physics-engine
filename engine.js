(async function () {
    const _global = typeof window === "undefined" ? global : window;
    const _exports = typeof window === "undefined" ? module.exports : window;
    let _p;
    _exports.Phygic = new Promise(r => _p = r);
    typeof require === "undefined" ? await (async function () {
        const script = document.createElement("script");
        script.src = "./collider2d.js";
        document.body.appendChild(script)
        await new Promise(r => script.onload = r);
        return Collider2D;
    })() : require("collider2d");
    const collider = new Collider2D.Collider2D();
    const {PI, floor, ceil, round, sqrt, pow, sin, cos, tan} = Math;

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
        this.path = path;
        this.fill = "#000000";
        this.stroke = "";
        this.type = "polygon";
    }

    Polygon.prototype.draw = function (world, tile) {
        const ctx = world.ctx;
        ctx.save();
        ctx.fillStyle = this.fill;
        ctx.strokeStyle = this.stroke;
        ctx.translate(tile.x, tile.y);
        ctx.rotate(-tile.rotation);
        ctx.translate(-tile.x, -tile.y);
        ctx.beginPath();
        this.path.forEach((i, j) => ctx[j === 0 ? "moveTo" : "lineTo"](tile.x + i[0], tile.y + i[1]));
        if (this.fill) ctx.fill();
        if (this.stroke) ctx.stroke();
        ctx.closePath();
        ctx.restore();
    };

    function Rectangle(width, height) {
        this.fill = "#000000";
        this.stroke = "";
        this.setSize(width, height);
        this.type = "rectangle";
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
                return w*h;
            case "circle":// TODO: improvements
                return Math.PI * this.shape.radius;
        }
    };
    Tile.prototype.setShape = function (shape) {
        this.shape = shape;
    };
    Tile.prototype.getDirection = function () {
        return new Vector2(cos(this.rotation), -sin(this.rotation));
    };
    Tile.prototype.getCollider = function () {
        switch (this.shape?.type) {
            case "circle":
                return ["circle", new Collider2D.Circle(new Collider2D.Vector(this.x, this.y), this.shape.radius)];
            case "polygon":
            case "rectangle":
                return ["polygon", new Collider2D.Polygon(new Collider2D.Vector(this.x, this.y), this.shape.path.map(i => new Collider2D.Vector(...i)))];
            default:
                return null;
        }
    };
    Tile.prototype.collidesWith = function (tile) {
        const A = this.getCollider() || ["point", this];
        const B = tile?.getCollider() || ["point", tile];
        switch (A[0]) {
            case "circle":
                switch (B[0]) {
                    case "circle":
                        return collider.testCircleCircle(A[1], B[1]);
                    case "polygon":
                        return collider.testPolygonCircle(A[1], B[1]);
                    case "point":
                        return collider.pointInCircle(A[1], B[1]);
                    default:
                        return false;
                }
            case "polygon":
                switch (B[0]) {
                    case "circle":
                        return collider.testPolygonCircle(A[1], B[1]);
                    case "polygon":
                        return collider.testPolygonPolygon(A[1], B[1]);
                    case "point":
                        return collider.pointInPolygon(A[1], B[1]);
                    default:
                        return false;
                }
            case "point":
                switch (B[0]) {
                    case "circle":
                        return collider.pointInCircle(A[1], B[1]);
                    case "polygon":
                        return collider.pointInPolygon(A[1], B[1]);
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
        if (Array.from(world.tiles).some(i => i !== this && i.collidesWith(this))) {
            this.set(this.sub(vec));
            return false;
        }
        return true;
    };
    Tile.prototype.update = function (world, deltaTime) {
        this.velocity.set(this.velocity.add(this.force));
        const terminalVelocity = sqrt(2 * this.mass * world.gravityAcceleration / (world.fluidDensity * this.getBottomArea() * this.dragCoefficient));
        if (this.gravityEnabled) this.velocity.y += this.mass * world.gravityAcceleration / (deltaTime || 1);
        //if (this.velocity.y > terminalVelocity) this.velocity.y = terminalVelocity;
        if (!this.move(world, {x: this.velocity.x, y: 0})) this.velocity.x /= 2;
        if (!this.move(world, {x: 0, y: this.velocity.y})) this.velocity.y /= 2;
        if (this.move(world, {x: this.motion.x, y: this.motion.y})) this.motion.set(this.motion.scale(9 / 10))
    };

    const worlds = {};
    let _w_id = 0;

    function World(canvas) {
        this.tiles = new Set;
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
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
                for (let i = 0; i < 1 / timeScale; i++) await new Promise(r => frameId = requestAnimationFrame(r));
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
            stop: () => cancelAnimationFrame(frameId),
            start: () => {
                cancelAnimationFrame(frameId);
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
        canvas.width = window.innerWidth * width;
        canvas.height = window.innerHeight * height;
        const fn = new Set;
        canvasResizeList.set(canvas, [width, height, fn]);
        return {remove: () => canvasResizeList.delete(canvas), addCallback: cb => fn.add(cb)};
    }

    addEventListener("resize", () => {
        canvasResizeList.forEach((info, canvas) => {
            canvas.width = window.innerWidth * info[0];
            canvas.height = window.innerHeight * info[1];
            info[2].forEach(i => i());
        });
    });

    function centerCanvas(canvas) {
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

    extendClass(Rectangle, Polygon);
    extendClass(Tile, Vector2);

    _exports.Phygic = {
        Vector2,
        Shapes: {Circle, Polygon, Rectangle},
        Tile,
        World,
        Utils: {Animator, CanvasResizer, centerCanvas}
    };
    _p(_exports.Phygic);
})();