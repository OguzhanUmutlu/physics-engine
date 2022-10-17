const {PI, sqrt, sin, cos, tan} = Math;
const deg = n => n / PI * 180;
const rad = n => n * PI / 180;

class Vector2 {
    static zero() {
        return new Vector2(0, 0)
    };

    constructor(x, y) {
        this.x = x;
        this.y = y;
    };

    add(x, y) {
        if (x instanceof Vector2) return this.add(x.x, x.y);
        this.x += x;
        this.y += y;
        return this;
    };

    subtract(x, y) {
        if (x instanceof Vector2) return this.add(x.x, x.y);
        this.x += x;
        this.y += y;
        return this;
    };

    length() {
        return sqrt(this.x ** 2 + this.y ** 2);
    };

    copy() {
        return new Vector2(this.x, this.y);
    };
}

const world = {
    gravityAcceleration: 10, // g
    frictionStaticCoefficient: .6,
    frictionKineticCoefficient: .2,
    fluidDensity: 1.225,
    get width() {
        return window.innerWidth;
    },
    get height() {
        return window.innerHeight;
    },
};

const ground = {
    alpha: 30, // α
    frictionFactor: 0.5, // k
};

class Box extends Vector2 { // square
    mass = 2; // m
    size = 60; // sqrt V
    velocity = 0; // v
    force = 0; // F
    color = "#ff6464";
    lastSafeX = 0;

    constructor() {
        super();
        this.x = world.width - this.size;
    }

    get frictionCoefficient() {
        const force = this.force + sin(rad(ground.alpha)) * this.mass * world.gravityAcceleration;
        return force > world.frictionStaticCoefficient ? world.frictionKineticCoefficient : world.frictionStaticCoefficient;
    };

    get dragCoefficient() {
        return 1.05;
    };

    get terminalVelocity() {
        return sqrt(2 * this.mass * world.gravityAcceleration / (world.fluidDensity * this.volume * this.dragCoefficient));
    };

    get frictionForce() {
        let f = this.frictionCoefficient * this.mass * world.gravityAcceleration * cos(rad(ground.alpha));
        if (f > sin(rad(ground.alpha)) * world.gravityAcceleration) f = sin(rad(ground.alpha)) * world.gravityAcceleration;
        return f;
    };

    get acceleration() { // F = ma
        return this.force / this.mass + sin(rad(ground.alpha)) * world.gravityAcceleration - this.frictionForce;
    };

    get volume() {
        return this.size; // ** 2;
    }

    get density() { // d = m / V
        return this.mass / this.volume;
    };

    draw() {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.lineWidth = 2;
        const x = this.x + this.size / 2;
        const y = world.height - tan(rad(ground.alpha)) * x - 6;
        const {size} = this;
        ctx.translate(x, y);
        ctx.rotate(-rad(ground.alpha));
        ctx.translate(-x, -y);
        ctx.fillRect(x - size, y - size, size, size);
        ctx.strokeRect(x - size, y - size, size + 1, size + 1);
        ctx.restore();
        ctx.fillRect(this.x, this.y, 1, 1);
    };

    update(deltaTime) {
        this.velocity += this.acceleration * deltaTime;
        this.x -= this.velocity;
        if (this.x < 0) this.x = world.width;
        if (this.x > world.width) this.x = 0;
        if (isNaN(this.velocity) || !isFinite(this.velocity)) this.velocity = 0;
        if (isNaN(this.x) || !isFinite(this.x)) this.x = this.lastSafeX;
        else this.lastSafeX = this.x;
    };
}

const box = new Box;

Object.defineProperty(window, "fps", {
    get: () => (window._fps || []).filter(i => i > Date.now()).length,
    set: () => window._fps = [...(window._fps || []), Date.now() + 1000]
});
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
dispatchEvent(new Event("resize"));
let mouseDown = false;
canvas.addEventListener("mousedown", ev => {
    mouseDown = true
    box.x = ev.clientX;
    box.velocity = 0;
});
addEventListener("mousemove", ev => {
    if (!mouseDown) return;
    box.x = ev.clientX;
    box.velocity = 0;
});
addEventListener("mouseup", () => mouseDown = false);
addEventListener("blur", () => mouseDown = false);
addEventListener("contextmenu", ev => ev.preventDefault());
const board = [
    {origin: box, set: "color", type: "color", text: n => n, default: "#ff6464"},
    {origin: world, set: "gravityAcceleration", range: [0, 100], text: n => `g = ${n} m/s<sup>2</sup>`, default: 9.807},
    {origin: ground, set: "alpha", range: [0, 89], text: n => `α = ${n}°`, default: 30},
    {origin: box, set: "size", range: [1, 300], text: n => `√V = ${n} m`, default: 60},
    {origin: box, set: "mass", range: [1, 100], text: n => `m = ${n} kg`, default: 2},
    {origin: box, set: "force", range: [-50, 50], text: n => `F = ${n} N`, default: 0},
    {origin: world, set: "fluidDensity", range: [0, 50], text: n => `ρ = ${n} N/m<sup>2</sup>`, default: 1.225},
    {
        origin: world, set: "frictionStaticCoefficient", range: [0, 50], text: n => `μ<sub>s</sub> = ${n} m/s`,
        default: .6
    },
    {
        origin: world, set: "frictionKineticCoefficient", range: [0, 50], text: n => `μ<sub>k</sub> = ${n} m/s`,
        default: .2
    },
    {origin: box, set: "acceleration", noInput: true, text: n => `a = ${n} m/s<sup>2</sup>`},
    {origin: box, set: "velocity", noInput: true, reset: true, text: n => `v = ${n} m/s`},
    {origin: box, set: "volume", noInput: true, text: n => `V = ${n} m<sup>2</sup>`},
    {origin: box, set: "density", noInput: true, text: n => `d = ${n} kg/m<sup>3</sup>`},
    {origin: box, set: "dragCoefficient", noInput: true, text: n => `C<sub>d</sub> = ${n}`},
    {origin: box, set: "terminalVelocity", noInput: true, text: n => `V<sub>t</sub> = ${n} m/s`},
    {origin: box, set: "frictionForce", noInput: true, text: n => `F<sub>f</sub> = ${n} N`},
];
let lastDelta = null;
const animate = () => {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, world.width, world.height);
    box.update((lastDelta === null ? 0 : Date.now() - lastDelta) / 1000);
    lastDelta = Date.now();
    box.draw();
    ctx.beginPath();
    ctx.moveTo(world.width, world.height - 5);
    ctx.lineTo(world.width, world.height - tan(rad(ground.alpha)) * world.width - 5);
    ctx.lineTo(0, world.height - 5);
    ctx.lineTo(world.width, world.height - 5);
    ctx.stroke();
    ctx.closePath();
    ctx.beginPath();
    ctx.arc(0, world.height - 5, 50, rad(0), rad(-ground.alpha), true);
    ctx.stroke();
    ctx.closePath();
    ctx.font = "16px Calibri";
    ctx.fillText("α", cos(rad(ground.alpha / 2)) * 60, world.height - sin(rad(ground.alpha / 2)) * 60);
    window.fps = null;
    board.forEach(i => {
        if (!i.noInput) i.origin[i.set] = isNaN(i.html.input.value * 1) ? i.html.input.value : i.html.input.value * 1;
        i.html.text.innerHTML = i.text(typeof i.origin[i.set] === "string" ? i.origin[i.set] : i.origin[i.set].toFixed(2).replace(".00", ""));
    });
};
const table = document.querySelector("table");
board.forEach(i => {
    const tr = document.createElement("tr");
    const text = document.createElement("td");
    const inputTd = document.createElement("td");
    const input = document.createElement("input");
    tr.appendChild(text);
    if (!i.noInput) {
        input.style.width = "100px";
        input.value = i.default;
        input.type = i.type || "number";
        inputTd.appendChild(input);
        tr.appendChild(inputTd);
        if (i.type !== "color") {
            input.min = i.range[0];
            input.max = i.range[1];
            const up = document.createElement("td");
            up.innerHTML = "⬆️";
            up.style.cursor = "pointer";
            tr.appendChild(up);
            const down = document.createElement("td");
            down.innerHTML = "⬇️";
            down.style.cursor = "pointer";
            tr.appendChild(down);
            up.addEventListener("click", () => input.value++);
            down.addEventListener("click", () => input.value--);
        }
    }
    if (i.reset) {
        const reset = document.createElement("td");
        reset.innerHTML = "🔄";
        reset.style.cursor = "pointer";
        tr.appendChild(reset);
        reset.addEventListener("click", () => {
            if (!i.noInput) input.value = i.default;
            i.origin[i.set] = i.default;
        });
    }
    i.html = {text, input};
    table.appendChild(tr);
});
animate();