(async function () {
    const isWeb = typeof window === "object" && typeof require === "undefined";
    const _global = isWeb ? window : global;
    const _exports = isWeb ? window : module.exports;
    let _p;
    let _id = 0;
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
    const {PI, floor, ceil, round, sqrt, pow, sin, cos, tan, abs, atan, atan2, min, max} = Math;

    function processOptions(options, def, mode = 0) {
        if (typeof options !== "object" || Array.isArray(options)) options = {};
        switch (mode) {
            case 0: // overwrite mode
                Object.keys(def).forEach(i => typeof options[i] !== typeof def[i] && (options[i] = def[i]));
                break;
            case 1: // exists mode
                Object.keys(def).forEach(i => !Object.keys(options).includes(i) && (options[i] = def[i]))
                break;
            case 2: // deep mode
                def.forEach(i => typeof eval(`options.${i[0]}`) !== typeof i[1] && eval(`options.${i[0]} = i[1]`));
                break;
        }
        return options;
    }

    function extendClass(self, extend) {
        Object.keys(extend.prototype).forEach(f => self.prototype[f] = extend.prototype[f]);
    }

    function positiveModulo(a, b) {
        a = a % b;
        if (a < 0) a += b;
        return a;
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
        const t = world.translation;
        const ctx = world.ctx;
        ctx.save();
        ctx.fillStyle = this.fill;
        ctx.strokeStyle = this.stroke;
        ctx.beginPath();
        ctx.arc(t.x + tile.x, t.y + tile.y, this.radius, 0, PI * 2);
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
        });
    }

    Polygon.prototype.draw = function (world, tile) {
        const ctx = world.ctx;
        ctx.save();
        ctx.translate(world.translation.x, world.translation.y);
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
        ctx.scale(world.scale, world.scale);
        (this._lastPoints || this.path).forEach((i, j) => ctx[j === 0 ? "moveTo" : "lineTo"](tile.x + i[0], tile.y + i[1]));
        if (this.fill) ctx.fill();
        if (this.stroke) ctx.stroke();
        ctx.closePath();
        const rnd = world.options.render;
        const rndCls = rnd.collisions;
        ctx.fillStyle = rndCls.color;
        (this._lastPoints || this.path).forEach(i => ctx.fillRect(tile.x + i.y - rndCls.size / 2, tile.y + i.y - rndCls.size / 2, rndCls.size, rndCls.size));
        ctx.fillRect(tile.x - rndCls.size / 2, tile.y - rndCls.size / 2, rndCls.size, rndCls.size);
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
        });
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

    const tiles = {};

    function Tile(x = 0, y = 0, opts) {
        Vector2.apply(this, arguments);
        opts = processOptions(opts, {
            shape: null, rotation: 0, isStatic: false, world: null, mass: 10,
            staticFrictionCoefficient: 0, kineticFrictionCoefficient: 0, dragCoefficient: 1
        }, 1);
        const id = _id++;
        tiles[id] = this;
        Object.defineProperty(this, "id", {
            get: () => id
        });
        this.shape = opts.shape;
        this.rotation = opts.rotation;
        this.rotationTarget = opts.rotation;
        this.verticalVelocity = 0;
        this.horizontalVelocity = 0;
        this.force = Vector2.zero();
        this.motion = Vector2.zero();
        this.mass = opts.mass;
        this.isStatic = opts.isStatic;
        this.dragCoefficient = opts.dragCoefficient;
        this.staticFrictionCoefficient = opts.staticFrictionCoefficient;
        this.kineticFrictionCoefficient = opts.kineticFrictionCoefficient;
        this.airTicks = 0;
        this.outOfDistance = false;
        if (opts.world instanceof World) opts.world.addTile(this);
        this.initOptions = opts;
        Object.freeze(this.initOptions);
    }

    Tile.getById = function (id) {
        return tiles[id];
    };
    Tile.prototype.getRadius = function () {
        switch (this.shape?.type) {
            case "polygon":
            case "rectangle":
                const a = this.shape.path.map(i => i[0]);
                const w = a.sort((a, b) => b - a)[0] - a.sort((a, b) => a - b)[0];
                const b = this.shape.path.map(i => i[1]);
                const h = b.sort((a, b) => b - a)[0] - b.sort((a, b) => a - b)[0];
                return sqrt(w ** 2 + h ** 2);
            case "circle":
                return this.shape.radius;
        }
    };
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
        switch (this.shape?.type) {
            case "circle":
                return ["circle", new Collider2D.Circle(new Collider2D.Vector(this.x, this.y), this.shape.radius)];
            case "polygon":
            case "rectangle":
                return ["polygon", new Collider2D.Polygon(new Collider2D.Vector(this.x, this.y), (this.shape._lastPoints || this.shape.path).map(i => new Collider2D.Vector(i[0], i[1])))];
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
    Tile.prototype.getCollisions = function (world) {
        return Array.from(world.tiles).find(i => i !== this && i.collidesWith(this));
    };
    Tile.prototype.move = function (world, vec) {
        //if (this.isStatic) return false;
        let collision;
        collision = this.getCollisions(world);
        if (collision) return false;
        let back;
        const start = this.clone();
        // let's ray-cast?
        const lRotation = atan2(vec.x, vec.y);
        //const radius = this.getRadius();
        const moveVec = new Vector2(sin(lRotation), cos(lRotation));//.scale(radius/2);
        const dist = min(ceil(vec.len() / moveVec.len()), world.maxRayCastingIterations);
        for (let i = 0; i < dist; i++) {
            back = this.clone();
            if (i === dist - 1) this.set(start.add(vec));
            else this.set(this.add(moveVec));
            collision = this.getCollisions(world);
            if (collision) break;
        }
        if (collision) {
            this.lastMoveGround = {tile: collision};
            this.airTicks = 0;
            if (collision.shape && (collision.shape.type === "polygon" || collision.shape.type === "rectangle")) {
                const shapePath = (collision.shape._lastPoints || collision.shape.path);
                const nearest = shapePath.map((i, j) => {
                    const next = shapePath[shapePath.length === j + 1 ? 0 : j + 1];
                    return new Collider2D.Polygon(new Collider2D.Vector(collision.x, collision.y), [
                        new Collider2D.Vector(i[0], i[1]),
                        new Collider2D.Vector(next[0], next[1])
                    ]);
                }).filter(i => this.collidesWith(i)).map(i => {
                    const from = {x: i.points[0].x + collision.x, y: i.points[0].y + collision.y};
                    const to = {x: i.points[1].x + collision.x, y: i.points[1].y + collision.y};
                    // NOTE: I don't use the wikipedia's formula anymore
                    // https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line#Line%20defined%20by%20an%20equation
                    const a = (to.y - from.y) / (to.x - from.x);
                    //const b = -1;
                    const c = from.y - a * from.x; // ax + c = y
                    //const x0 = this.x;
                    //const y0 = this.y;
                    // Thanks to Olly :p
                    //const dist = abs(a * x0 + b * y0 + c) / sqrt(a ** 2 + b ** 2);
                    const mag = 1 + a ** 2;
                    //const vec = [(this.x + a * (this.y - c)) / mag, (a * this.x + a ** 2 * (this.y - c)) / mag + c];
                    const vecY = (a * this.x + a ** 2 * (this.y - c)) / mag + c;
                    return [a, vecY];
                }).sort((a, b) => b[1] - a[1])[0];
                if (nearest) {
                    if (abs(nearest[0]) === Infinity) nearest[0] = 0;
                    this.lastMoveGround.slope = nearest[0];
                    this.rotationTarget = -atan(nearest[0]);
                    this.lastMoveGround.rotation = -atan(nearest[0]);
                    if (this.rotationTarget === 90) this.rotationTarget = 0;
                }
            }
            this.set(back);
            return false;
        }
        return true;
    };
    Tile.prototype.update = function (world, deltaTime) {
        if (!deltaTime) return;
        if (this.dist(world.translation) > sqrt((world.canvas.width * (1 / world.scale)) ** 2 + (world.canvas.height * (1 / world.scale)) ** 2) / 2 + world.updateDistance) return this.outOfDistance = true;
        this.outOfDistance = false;
        if (deltaTime > 100) console.warn(deltaTime);
        // NOTE: I got the square root of the bottom area(not sure what I could have done)
        const terminalVelocity = sqrt(2 * this.mass * world.gravityAcceleration / (world.fluidDensity * sqrt(this.getBottomArea()) * this.dragCoefficient));
        if (!this.isStatic) {
            this.verticalVelocity += (this.mass * world.gravityAcceleration + this.force.y / this.mass) * deltaTime / 1000;
            if (!this.move(world, new Vector2(0, this.verticalVelocity))) this.verticalVelocity = 0;

            this.horizontalVelocity += this.getHorizontalAcceleration(world) * deltaTime / 1000;
            if (!this.move(world, new Vector2(sin(this.rotation + PI / 2) * this.horizontalVelocity, cos(this.rotation + PI / 2) * this.horizontalVelocity))) this.horizontalVelocity = 0;
            if (this.airTicks > 3) {
                if (this.rotationTarget > 0) this.rotationTarget -= Math.PI / 180;
                if (this.rotationTarget < 0) this.rotationTarget += Math.PI / 180;
            }
        }
        if (round(this.motion.x) !== 0 && round(this.motion.y) !== 0) this.move(world, new Vector2(this.motion.x / 10, this.motion.y / 10));
        this.motion.set(this.motion.scale(9 / 10));
        this.rotation += (this.rotationTarget - this.rotation) / 2;
        this.airTicks++;
    };
    Tile.prototype.isOnGround = function () {
        return this.airTicks <= 2 && !!this.lastMoveGround;
    };
    Tile.prototype.getGroundFrictionForce = function (world) {
        const onGround = this.isOnGround();
        const μk = onGround ? this.lastMoveGround.tile.kineticFrictionCoefficient : 0;
        const μs = onGround ? this.lastMoveGround.tile.staticFrictionCoefficient : 0;
        const groundRotation = onGround ? this.lastMoveGround.rotation : 0;
        const gh = this.mass * world.gravityAcceleration * -sin(groundRotation);
        const gv = this.mass * world.gravityAcceleration * cos(groundRotation);
        const Fh = this.force.x / (-sin(groundRotation) || 1);
        const Fv = this.force.y / cos(groundRotation);
        const N = gv + Fv;
        const totalH = gh + Fh;
        if (onGround) {
            const Ffk = μk * N;
            const Ffs = μs * N;
            return {
                hasPassedStatic: totalH > Ffs,
                frictionForce: totalH > Ffs ? Ffk : totalH,
                kineticCoefficient: μk, staticCoefficient: μs
            };
        } else return {
            hasPassedStatic: false, frictionForce: 0, kineticCoefficient: 0, staticCoefficient: 0
        };
    };
    Tile.prototype.getHorizontalAcceleration = function (world) {
        if (!this._lastHorizontalAcceleration) this._lastHorizontalAcceleration = [];
        const onGround = this.isOnGround();
        const μk = onGround ? this.lastMoveGround.tile.kineticFrictionCoefficient : 0;
        const μs = onGround ? this.lastMoveGround.tile.staticFrictionCoefficient : 0;
        const groundRotation = onGround ? this.lastMoveGround.rotation : 0;
        if (this._lastHorizontalAcceleration[0] === onGround && this._lastHorizontalAcceleration[1] === μk && this._lastHorizontalAcceleration[2] === μs && this._lastHorizontalAcceleration[3] === groundRotation) return this._lastHorizontalAcceleration[4];
        this._lastHorizontalAcceleration = [
            onGround, μk, μs, groundRotation
        ];

        const gh = this.mass * world.gravityAcceleration * -sin(groundRotation);
        const gv = this.mass * world.gravityAcceleration * cos(groundRotation);

        const Fh = this.force.x / (-sin(groundRotation) || 1);
        const Fv = this.force.y / cos(groundRotation);

        const N = gv + Fv;
        const totalH = gh + Fh;

        let FNet = totalH;

        if (onGround) {
            const Ffk = μk * N;
            const Ffs = μs * N;
            const Fs = totalH > Ffs ? Ffk : totalH;
            FNet -= Fs;
        }
        this._lastHorizontalAcceleration[4] = FNet / this.mass;
        return this._lastHorizontalAcceleration[4];
    };
    Tile.prototype.resetVelocities = function () {
        this.verticalVelocity = 0;
        this.horizontalVelocity = 0;
        this.motion.set(Vector2.zero());
        this.force.set(Vector2.zero());
    };

    const worlds = {};

    function World(canvas, options) {
        options = processOptions(options, [
            ["render", {}],
            ["render.collisions", {}],
            ["render.collisions.color", ""],
            ["render.collisions.size", 4],
            ["scale", 1],
            ["maxRayCastingIterations", 1000],
            ["updateDistance", 10000],
        ], 2);
        this.options = options;
        this.scale = options.scale;
        this.translation = Vector2.zero();
        this.tiles = new Set;
        this.canvas = canvas;
        this.ctx = canvas.getContext ? canvas.getContext("2d") : options.ctx;
        this.gravityAcceleration = 2; // px / second
        this.fluidDensity = 1.225;
        this.maxRayCastingIterations = options.maxRayCastingIterations;
        this.updateDistance = options.updateDistance;
        const id = _id++;
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
    World.prototype.translate = function (x, y) {
        this.translation.set(this.translation.add(new Vector2(x, y)));
    };
    World.prototype.translateScale = function (x, center = new Vector2(innerWidth / 2, innerHeight / 2)) {
        if (this.scale + x <= 0) x = -this.scale / 10;// TODO: improvements on zooming back
        this.scale += x;
        this.translate(-center.x * x, -center.y * x);
    };
    World.prototype.addTile = function (tile) {
        this.tiles.add(tile);
    };
    World.prototype.removeTile = function (tile) {
        this.tiles.delete(tile);
    };
    World.prototype.getMouseVector = function (v) {
        return new Vector2((v.offsetX || v.x) - this.translation.x, (v.offsetY || v.y) - this.translation.y).scale(1 / this.scale);
    };

    function Animator(...fn) {
        if (fn.length > 1) return fn.map(fn => Animator(fn));
        fn = fn[0];
        if (!Array.isArray(fn)) fn = [fn];
        fn = new Set(fn);
        let _fps = [];
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
            _fps.push(Date.now());
            _fps = _fps.filter(i => i > Date.now() - 1000);
            if (repeat) await animate();
        };
        animate();
        return {
            getFrameId: () => frameId,
            getFPS: () => _fps.length,
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
        const id = _id++;
        world.mouseConstraints = [...(world.mouseConstraints || []), id];
        const el = world.canvas;
        const listeners = [];
        const l = (e, n, f) => {
            listeners.push(e, n, f);
            e.addEventListener(n, f);
        };
        let down = false;
        let drag = null;
        l(el, "mousedown", ev => {
            down = true;
            const vec = world.getMouseVector(ev);
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
                if (drag && drag.tile) drag.tile.isStatic = drag.gravity;
                drag = {tile, gravity: tile.isStatic, mouse: vec, tileVec: tile.clone()};
                tile.isStatic = true;
            }
        });
        l(el, "mousemove", ev => {
            if (!down || !drag) return;
            const vec = world.getMouseVector(ev);
            drag.tile.set(drag.tileVec.add(vec.sub(drag.mouse)));
            drag.tile.resetVelocities();
        });
        l(el, "mouseup", () => {
            down = false;
            if (drag) drag.tile.isStatic = drag.gravity;
            drag = null;
        });
        l(window, "blur", () => {
            down = false;
            if (drag) drag.tile.isStatic = drag.gravity;
            drag = null;
        });
        return {
            remove: () => {
                listeners.forEach(i => i[0].removeEventListener(...i.slice(1)));
                world.mouseConstraints = (world.mouseConstraints || []).filter(i => i !== id);
            }
        };
    }

    function CameraMover(world, options) {
        if (!isWeb) throw new Error("You can't use MouseConstraint method on a non-web platform.");
        if (!world) return console.warn("No world was given for MouseConstraint.");
        const id = _id++;
        const el = world.canvas;
        options = processOptions(options, {
            zoom: true,
            move: true
        });
        world.cameraMovers = [...(world.cameraMovers || []), id];
        const listeners = [];
        const l = (e, n, f) => {
            listeners.push(e, n, f);
            e.addEventListener(n, f);
        };
        if (options.zoom) l(el, "wheel", ev => {
            world.translateScale(-ev.deltaY / 5000, new Vector2(ev.offsetX, ev.offsetY));
        });
        if (options.move) {
            let moving = false;
            l(el, "mousedown", ev => {
                const vec = world.getMouseVector(ev);
                if (world.mouseConstraints.length > 0 && !Array.from(world.tiles).some(i => i.collidesWith(vec)))
                    moving = true;
            });
            l(el, "mousemove", ev => {
                if (!moving) return;
                world.translate(ev.movementX, ev.movementY);
            });
            l(el, "mouseup", () => moving = false);
            l(window, "blur", () => moving = false);
        }
        return {
            remove: () => {
                listeners.forEach(i => i[0].removeEventListener(...i.slice(1)));
                world.cameraMovers = (world.cameraMovers || []).filter(i => i !== id);
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
        Utils: {Animator, CanvasResizer, centerCanvas, MouseConstraint, CameraMover},
        DevUtils: {processOptions, extendClass, positiveModulo}
    };
    _p(_exports.Phygic);
})();