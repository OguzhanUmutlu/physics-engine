const {PI, sin, cos, tan} = Math;
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
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    };

    copy() {
        return new Vector2(this.x, this.y);
    };
}

const world = {
    gravityAcceleration: 10, // g
    get width() {
        return window.innerWidth;
    },
    get height() {
        return window.innerHeight;
    }
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

    constructor() {
        super();
        this.pos();
    }

    get acceleration() { // F = ma
        return this.force / this.mass;
    };

    pos() {
        const x = world.width / 2 + this.size / 2;
        const y = world.height - tan(rad(ground.alpha)) * x - this.size / 1.5;
        this.x = x;
        this.y = y;
    };

    draw() {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.lineWidth = 2;
        // ctx.rotate()
        ctx.translate(this.x, this.y);
        ctx.rotate(-rad(ground.alpha));
        ctx.translate(-this.x, -this.y);
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        ctx.strokeRect(this.x - this.size / 2, this.y - this.size / 2, this.size + 1, this.size + 1);
        ctx.restore();
    };

    update() {
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
canvas.addEventListener("mousedown", () => mouseDown = true);
addEventListener("mousemove", ev => {
    if (!mouseDown) return;
    box.x = ev.offsetX;
    box.y = ev.offsetY;
});
addEventListener("mouseup", () => mouseDown = false);
addEventListener("blur", () => mouseDown = false);
addEventListener("contextmenu", ev => ev.preventDefault());
const animate = () => {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, world.width, world.height);
    box.update();
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
    const a = document.querySelector("#angle-i").value * 1;
    if (a !== ground.alpha) box.pos();
    ground.alpha = a;
    document.querySelector("#angle-l").innerHTML = ground.alpha + "°";
    box.color = document.querySelector("#color").value;
};
animate();