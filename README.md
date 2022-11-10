# physics-engine

Physics engine that I made with the stuff we learned in school

Used lots of trig functions and "Newton"s equations

[Click to view old preview](https://oguzhanumutlu.github.io/physics-engine/legacy)

[Click to view new preview](https://oguzhanumutlu.github.io/physics-engine)

# Importing

Just add this to your HTML to import it!

```html
<script src="https://unpkg.com/physics-engine"></script>
```

# Example

## Add a canvas to your body, so you can use it for rendering

```html
<body>
    <canvas></canvas>
</body>
```

## Initializing physics engine

```html

<script>
    window.Phygic.then(Phygic => {
        // your code goes here!
        console.log("Phygic has been loaded! ", Phygic);
    });
</script>
```

## Getting canvas

```js
const canvas = document.querySelector("canvas");
```

## Creating a physics world

Note: If you don't want the renderer you don't have to enter the canvas element

```js
const world = new Phygic.World(canvas);
```

## Rendering

✨ Just run this function and done! ✨

```js
world.createAnimators();
```

## Adding camera movement, tile dragging etc.

✨ Again, just one line! ✨

```js
world.addHelpers();
```

## Adding a box

✨ Still one line! ✨

```js
new Phygic.Tile(50, 0, world);
```

## Adding a static tile so our box doesn't fall to the nothingness

✨ You get the idea everything is one line. ✨

```js
new Phygic.Tile(50, 500, {world, isStatic: true});
```

## Final product:

[Preview](https://oguzhanumutlu.github.io/physics-engine/example.html)

```html
<body>
    <canvas></canvas>
</body>
<script src="https://unpkg.com/physics-engine"></script>
<script>
    window.Phygic.then(Phygic => {
        const canvas = document.querySelector("canvas");

        const world = new Phygic.World(canvas);

        world.createAnimators();

        world.addHelpers();

        new Phygic.Tile(50, 0, world);
        
        new Phygic.Tile(50, 500, {world, isStatic: true});
    });
</script>
```