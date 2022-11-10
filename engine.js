// noinspection JSUnusedGlobalSymbols, JSUnusedLocalSymbols

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
        script.src = "./collider2d.min.js";
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
        const ctx = world.ctx;
        ctx.save();
        ctx.translate(world.translation.x, world.translation.y);
        ctx.fillStyle = this.fill;
        ctx.strokeStyle = this.stroke;
        ctx.beginPath();
        ctx.scale(world.scale, world.scale);
        ctx.arc(tile.x, tile.y, this.radius, 0, PI * 2);
        if (this.fill) ctx.fill();
        if (this.stroke) ctx.stroke();
        ctx.closePath();
        const rnd = world.options.render;
        const rndCls = rnd.collisions;
        ctx.fillStyle = rndCls.color;
        ctx.fillRect(tile.x - rndCls.size / 2, tile.y - rndCls.size / 2, rndCls.size, rndCls.size);
        if (tile.lastMoveGround) ctx.fillRect(tile.x, tile.lastMoveGround.interY, 5, 5);
        ctx.restore();
    };

    function PathShape(path) {
        this.fill = "#000000";
        this.stroke = "";
        this.type = "path";
        this.isPathShape = true;
        Object.defineProperty(this, "path", {
            get: () => path,
            set: v => {
                path = v;
                this._hasChanged = true;
            }
        });
    }

    PathShape.prototype.draw = function (world, tile) {
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
        if (rndCls.color) (this._lastPoints || this.path).forEach(i => ctx.fillRect(tile.x + i.y - rndCls.size / 2, tile.y + i.y - rndCls.size / 2, rndCls.size, rndCls.size));
        ctx.fillRect(tile.x - rndCls.size / 2, tile.y - rndCls.size / 2, rndCls.size, rndCls.size);
        //if (tile.lastMoveGround ) ctx.fillRect(tile.x, tile.lastMoveGround.interY, 5, 5);
        ctx.restore();
    };

    function Polygon(sides, radius) {
        this.fill = "#000000";
        this.stroke = "";
        this.type = "polygon";
        this.isPathShape = true;
        this._sides = sides;
        this._radius = radius;
        this.setSides(sides);
        Object.defineProperties(this, {
            sides: {
                get: () => this._sides,
                set: v => {
                    this._sides = v;
                    this.setSides(this._sides);
                }
            },
            radius: {
                get: () => this._radius,
                set: v => {
                    this._radius = v;
                    this.setRadius(this._radius);
                }
            }
        });
    }

    Polygon.prototype.setRadius = function (radius) {
        this._radius = radius;
        this.setSides(this._sides);
    };
    Polygon.prototype.setSides = function (sides) {
        this._sides = sides;
        this.path = [..." ".repeat(sides)].map((_, i) => [sin(PI * 2 / sides * (i - .5)) * this._radius, cos(PI * 2 / sides * (i - .5)) * this._radius]);
        this.path.push(this.path[0]);
    };
    Polygon.prototype.setRadiusAndSides = function (radius, sides) {
        this._radius = radius;
        this.setSides(sides);
    };

    function Rectangle(width, height) {
        this.fill = "#000000";
        this.stroke = "";
        this.setSize(width, height);
        this.type = "rectangle";
        this.isPathShape = true;
        this._width = width;
        this._height = height;
        Object.defineProperties(this, {
            width: {
                get: () => this._width,
                set: v => {
                    this._width = v;
                    this.setSize(this._width, this._height);
                }
            },
            height: {
                get: () => this._height,
                set: v => {
                    this._height = v;
                    this.setSize(this._width, this._height);
                }
            }
        });
    }

    Rectangle.prototype.setSize = function (width, height) {
        this._width = width;
        this._height = height;
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
        if (opts instanceof World) opts = {world: opts};
        opts = processOptions(opts, {
            shape: new Rectangle(20, 20), rotation: 0, isStatic: false, world: null, mass: 10,
            staticFrictionCoefficient: 0, kineticFrictionCoefficient: 0, dragCoefficient: 1,
            gravityEnabled: true
        }, 1);
        const id = _id++;
        tiles[id] = this;
        Object.defineProperty(this, "id", {
            get: () => id
        });
        this.shape = opts.shape;
        if (typeof opts.angle === "number") {
            this.setAngle(opts.angle);
        } else this.setRotation(opts.rotation);
        this.verticalVelocity = 0;
        this.horizontalVelocity = 0;
        this.force = Vector2.zero();
        this.motion = Vector2.zero();
        this.mass = opts.mass;
        this.isStatic = opts.isStatic;
        this.gravityEnabled = opts.gravityEnabled;
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
    Tile.prototype.setRotation = function (radians) {
        this.rotationTarget = radians;
        this.rotation = radians;
    };
    Tile.prototype.setAngle = function (angle) {
        this.setRotation(angle / 180 * PI);
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
    Tile.prototype.getCollision = function (world) {
        return Array.from(world.tiles).find(i => i !== this && i.collidesWith(this));
    };
    Tile.prototype.getCollisions = function (world) {
        return Array.from(world.tiles).filter(i => i !== this && i.collidesWith(this));
    };
    Tile.prototype.move = function (world, vec) {
        if (this.isStatic) return false;
        let collision;
        collision = this.getCollision(world);
        /*if (collision) {
            this.airTicks = 0;
            return false;
        }*/
        const applyCollisionRotation = () => {
            const last = {};
            if (collision.shape && collision.shape.isPathShape) {
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
                }).filter(i => this.y <= i[1]).sort((a, b) => b[1] - a[1])[0];
                if (nearest) {
                    if (abs(nearest[0]) === Infinity) nearest[0] = 0;
                    last.slope = nearest[0];
                    this.rotationTarget = -atan(nearest[0]);
                    last.rotation = -atan(nearest[0]);
                    last.interY = nearest[1];
                    if (this.rotationTarget === 90) this.rotationTarget = 0;
                }
            }
            return last;
        };

        let back = this.clone();
        let backRotation = this.rotationTarget;
        const start = this.clone();
        // let's ray-cast?
        const lRotation = atan2(vec.x, vec.y);
        //const radius = this.getRadius();
        const moveVec = new Vector2(sin(lRotation), cos(lRotation));//.scale(radius/2);
        const expectedDist = ceil(vec.len() / moveVec.len());
        const dist = min(expectedDist, world.maxRayCastingIterations);
        const moveScalar = expectedDist / dist;
        moveVec.set(moveVec.scale(moveScalar));
        let rotationChecked = null;
        for (let i = 0; i < dist; i++) {
            back = this.clone();
            if (i === dist - 1) this.set(start.add(vec));
            else this.set(this.add(moveVec));
            collision = this.getCollision(world);
            if (collision) {
                backRotation = this.rotationTarget;
                rotationChecked = applyCollisionRotation();
                if (this.getCollision(world)) break;
            }
        }

        if (collision) {
            this.airTicks = 0;
            if (rotationChecked) {
                this.lastMoveGround = rotationChecked;
                this.lastMoveGround.tile = collision;
            }
            this.set(back);
            this.rotation = backRotation;
            return false;
        }
        return true;
    };
    Tile.prototype.update = function (world, deltaTime) {
        if (!deltaTime) return;
        if (this.dist(world.translation) > sqrt(((world.canvas ? world.canvas.width : 1000) * (1 / world.scale)) ** 2 + ((world.canvas ? world.canvas.height : 1000) * (1 / world.scale)) ** 2) / 2 + world.updateDistance) return this.outOfDistance = true;
        this.outOfDistance = false;
        // FIXED TO DO: BUG: it sometimes stands on 29-28 degrees instead of 30
        // FIXED TO DO: add this as an option to the world
        if (world.warnOverDeltaTime && deltaTime > 100 / world.timeScale) console.warn(deltaTime);
        // NOTE: I got the square root of the bottom area(not sure what I could have done)
        // TODO: BUG: when there is a sloped and a horizontal surface and put the tile on top of the sloped it stops when it touches the horizontal surface
        // TODO: when moving transfer the acceleration to the top one and add horizontal friction forces to both
        // TODO: constraints/ropes
        // TODO: increase the normal vector whilst something is on top of that tile
        const terminalVelocity = sqrt(2 * this.mass * world.gravityAcceleration / (world.fluidDensity * sqrt(this.getBottomArea()) * this.dragCoefficient));
        if (!this.isStatic) {
            if (isNaN(this.verticalVelocity)) this.verticalVelocity = 0;
            if (isNaN(this.horizontalVelocity)) this.horizontalVelocity = 0;
            if (this.gravityEnabled) this.verticalVelocity += (this.mass * world.gravityAcceleration + this.force.y / this.mass) * deltaTime / 1000;
            if (!this.move(world, new Vector2(0, this.verticalVelocity))) {
                if (this.lastMoveGround) this.lastMoveGround.tile.verticalVelocity += this.verticalVelocity;
                this.verticalVelocity = 0;
            }

            this.horizontalVelocity += this.getHorizontalAcceleration(world) * deltaTime / 1000;
            const frictionAcceleration = this._Fs / this.mass * deltaTime / 1000;
            const pos = this.horizontalVelocity > 0;
            this.horizontalVelocity += (pos ? -1 : 1) * frictionAcceleration;
            if (pos !== (this.horizontalVelocity > 0)) this.horizontalVelocity = 0
            if (!this.move(world, new Vector2(sin(this.rotation + PI / 2) * this.horizontalVelocity, cos(this.rotation + PI / 2) * this.horizontalVelocity))) {
                if (this.lastMoveGround) this.lastMoveGround.tile.horizontalVelocity += this.horizontalVelocity;
                this.horizontalVelocity = 0;
            }
            if (this.airTicks > 3) {
                if (this.rotationTarget > 0) this.rotationTarget -= Math.PI / 180 * this.verticalVelocity;
                if (this.rotationTarget < 0) this.rotationTarget += Math.PI / 180 * this.verticalVelocity;
            }
        }
        if (round(this.motion.x) !== 0 && round(this.motion.y) !== 0) this.move(world, new Vector2(this.motion.x / 10, this.motion.y / 10));
        this.motion.set(this.motion.scale(9 / 10));
        //let befRotation = this.rotation;
        this.rotation = this.rotationTarget;
        //if (this.getCollision(world)) this.rotation = befRotation;
        if (!this.isStatic) this.airTicks++;
    };
    Tile.prototype.isOnGround = function () {
        return this.airTicks <= 2 && !!this.lastMoveGround;
    };
    Tile.prototype.getLastGroundFrictionForce = function () {
        if (!this._lastHorizontalAcceleration || !this.isOnGround()) return {
            frictionForce: 0,
            kineticCoefficient: 0,
            staticCoefficient: 0
        };
        return {
            frictionForce: this._Fs,
            kineticCoefficient: this._lastHorizontalAcceleration[1],
            staticCoefficient: this._lastHorizontalAcceleration[2]
        };
    };
    Tile.prototype.getHorizontalAcceleration = function (world) {
        if (!this._lastHorizontalAcceleration) this._lastHorizontalAcceleration = [];
        const onGround = this.isOnGround();
        const mik = onGround ? this.lastMoveGround.tile.kineticFrictionCoefficient : 0;
        const mis = onGround ? this.lastMoveGround.tile.staticFrictionCoefficient : 0;
        const groundRotation = onGround ? this.lastMoveGround.rotation : 0;
        const expected = [
            onGround, mik, mis, groundRotation, this.force.x, this.force.y
        ];
        if (expected.every((i, j) => i === this._lastHorizontalAcceleration[j])) return this._lastHorizontalAcceleration[6];
        this._lastHorizontalAcceleration = expected;

        const gh = this.mass * world.gravityAcceleration * -sin(groundRotation);
        const gv = this.mass * world.gravityAcceleration * cos(groundRotation);

        const Fh = this.force.x / (-sin(groundRotation) || 1);
        const Fv = this.force.y / (cos(groundRotation) || 1);

        const N = gv + Fv;
        this._N = N;
        let FNet = gh + Fh;
        this._Fs = 0;

        if (onGround) {
            const Ffk = mik * N;
            const Ffs = mis * N;
            let Fs = FNet > Ffs ? Ffk : FNet;
            if (FNet === 0) Fs = Ffk;
            //FNet += (FNet > 0 ? -1 : 1) * Fs;
            this._Fs = Fs;
            this._Ffk = Ffk;
            this._Ffs = Ffs;
        }
        this._FNet = FNet;
        this._lastHorizontalAcceleration[6] = FNet / this.mass;
        return this._lastHorizontalAcceleration[6];
    };
    Tile.prototype.resetVelocities = function () {
        this.verticalVelocity = 0;
        this.horizontalVelocity = 0;
        this.motion.set(Vector2.zero());
        this.force.set(Vector2.zero());
    };

    const worlds = {};

    function World(options, a) {
        if (options.getContext) {
            if (typeof a !== "object" || Array.isArray(a)) a = {};
            a.canvas = options;
            options = a;
        }
        options = processOptions(options, [
            ["render", {}],
            ["render.collisions", {}],
            ["render.collisions.color", ""],
            ["render.collisions.size", 4],
            ["scale", 1],
            ["maxRayCastingIterations", 1000],
            ["updateDistance", 10000],
            ["timeScale", 1],
            ["gravityAcceleration", 2],
            ["warnOverDeltaTime", false]
        ], 2);
        this.options = options;
        this.scale = options.scale;
        this.translation = Vector2.zero();
        this.tiles = new Set;
        this.canvas = options.canvas;
        this.ctx = options.canvas.getContext ? options.canvas.getContext("2d") : options.ctx;
        this.gravityAcceleration = options.gravityAcceleration; // px / second^2
        this.fluidDensity = 1.225;
        this.maxRayCastingIterations = options.maxRayCastingIterations;
        this.updateDistance = options.updateDistance;
        this.timeScale = options.timeScale;
        this.warnOverDeltaTime = options.warnOverDeltaTime;
        const id = _id++;
        worlds[id] = this;
        Object.defineProperty(this, "id", {
            get: () => id
        });
        this.update = function () {
            const self = worlds[id];
            self.tiles.forEach(function (tile) {
                tile.update(self, (tile.lastUpdate ? Date.now() - tile.lastUpdate : 0) * self.timeScale);
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
    World.prototype.createAnimators = function (opt) {
        opt = processOptions(opt, {
            renderMethod: "frame",
            updateMethod: "timeout"
        });
        const animators = Animator(this.render, this.update);
        animators[0].setMethod(opt.renderMethod);
        animators[1].setMethod(opt.updateMethod);
        return animators;
    };
    World.prototype.addHelpers = function (opt) {
        opt = processOptions(opt, {
            center: true,
            resize: true,
            constraint: true,
            mover: true
        });
        if (opt.center) centerCanvas(this.canvas);
        if (opt.resize) CanvasResizer(this.canvas);
        if (opt.constraint) MouseConstraint(this);
        if (opt.mover) CameraMover(this);
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
        let method = "frame";
        const animate = async (repeat = true) => {
            fn.forEach(i => i());
            if (timeScale <= 1) {
                for (let i = 0; i < 1 / timeScale; i++) await new Promise(r => frameId = (method === "frame" ? _requestAnimationFrame : setTimeout)(r));
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
            removeCallback: cb => fn.delete(cb),
            setMethod: m => method = m
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
        const done = () => {
            down = false;
            if (drag) drag.tile.isStatic = drag.gravity;
            drag = null;
        };
        l(el, "mouseup", done);
        l(window, "blur", done);
        l(window, "mouseout", done);
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
            l(window, "mouseout", () => moving = false);
        }
        return {
            remove: () => {
                listeners.forEach(i => i[0].removeEventListener(...i.slice(1)));
                world.cameraMovers = (world.cameraMovers || []).filter(i => i !== id);
            }
        };
    }

    extendClass(Polygon, PathShape);
    extendClass(Rectangle, PathShape);
    extendClass(Tile, Vector2);

    _exports.Phygic = {
        Vector2,
        Shapes: {Circle, PathShape, Polygon, Rectangle},
        Tile,
        World,
        Utils: {Animator, CanvasResizer, centerCanvas, MouseConstraint, CameraMover},
        DevUtils: {processOptions, extendClass, positiveModulo}
    };
    _p(_exports.Phygic);
})();