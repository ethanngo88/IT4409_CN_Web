// Import the data to customize and insert them into page
const fetchData = () => {
  fetch("customize.json")
    .then(data => data.json())
    .then(data => {
      dataArr = Object.keys(data);
      dataArr.map(customData => {
        if (data[customData] !== "") {
          if (customData === "imagePath") {
            document
              .querySelector(`[data-node-name*="${customData}"]`)
              .setAttribute("src", data[customData]);
          } else {
            document.querySelector(`[data-node-name*="${customData}"]`).innerText = data[customData];
          }
        }

        // Check if the iteration is over
        // Run amimation if so
        if ( dataArr.length === dataArr.indexOf(customData) + 1 ) {
          animationTimeline();
        } 
      });
    });
};

const random = (min, max) => min + Math.random() * (max - min);

// Starry night: twinkling stars and the odd shooting star, drawn behind the page
const starrySky = () => {
  const canvas = document.querySelector(".sky");
  const ctx = canvas.getContext("2d");

  // Pre-render a soft glowing dot per star color, then stamp it for every star
  const sprite = rgb => {
    const dot = document.createElement("canvas");
    dot.width = dot.height = 32;
    const dotCtx = dot.getContext("2d");
    const glow = dotCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
    glow.addColorStop(0, `rgba(${rgb}, 1)`);
    glow.addColorStop(0.2, `rgba(${rgb}, 0.8)`);
    glow.addColorStop(0.5, `rgba(${rgb}, 0.15)`);
    glow.addColorStop(1, `rgba(${rgb}, 0)`);
    dotCtx.fillStyle = glow;
    dotCtx.fillRect(0, 0, 32, 32);
    return dot;
  };
  const white = sprite("255, 255, 255");
  const sprites = [white, white, white, sprite("190, 215, 255"), sprite("255, 225, 180")];

  // Positions are fractions of the screen, so resizing just stretches the sky
  const stars = Array.from(
    { length: Math.min(1200, Math.round((window.innerWidth * window.innerHeight) / 2000)) },
    () => ({
      x: Math.random(),
      y: Math.random(),
      size: 3 + Math.pow(Math.random(), 4) * 9,
      sprite: sprites[Math.floor(Math.random() * sprites.length)],
      brightness: random(0.6, 1),
      speed: random(0.5, 2.5),
      phase: random(0, Math.PI * 2)
    })
  );

  let meteor = null;
  let nextMeteor = random(2000, 5000);
  let lastTime = 0;

  const resize = () => {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * ratio;
    canvas.height = window.innerHeight * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const draw = time => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const delta = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;
    ctx.clearRect(0, 0, width, height);

    stars.forEach(star => {
      const twinkle = 0.5 + 0.5 * Math.sin((time / 1000) * star.speed + star.phase);
      ctx.globalAlpha = star.brightness * (0.35 + 0.65 * twinkle);
      ctx.drawImage(
        star.sprite,
        star.x * width - star.size / 2,
        star.y * height - star.size / 2,
        star.size,
        star.size
      );
    });

    // Every few seconds a shooting star streaks down across the upper sky
    if (!meteor && time > nextMeteor) {
      meteor = {
        x: random(0.1, 0.9) * width,
        y: random(0, 0.4) * height,
        direction: Math.random() < 0.5 ? -1 : 1,
        angle: random(0.15, 0.3) * Math.PI,
        speed: random(600, 900),
        age: 0,
        life: random(0.8, 1.3)
      };
    }
    if (meteor) {
      meteor.age += delta;
      const progress = Math.min(meteor.age / meteor.life, 1);
      const distance = meteor.speed * meteor.age;
      const dx = Math.cos(meteor.angle) * meteor.direction;
      const dy = Math.sin(meteor.angle);
      const headX = meteor.x + dx * distance;
      const headY = meteor.y + dy * distance;
      const tail = Math.min(distance, 140);
      const trail = ctx.createLinearGradient(headX, headY, headX - dx * tail, headY - dy * tail);
      trail.addColorStop(0, "rgba(255, 255, 255, 1)");
      trail.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.globalAlpha = Math.sin(progress * Math.PI);
      ctx.strokeStyle = trail;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(headX, headY);
      ctx.lineTo(headX - dx * tail, headY - dy * tail);
      ctx.stroke();

      if (progress === 1) {
        meteor = null;
        nextMeteor = time + random(3000, 8000);
      }
    }

    requestAnimationFrame(draw);
  };

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(draw);
};

// Photo rain: each photo falls from the top with its own tilt, sway and speed
const photoRain = () => {
  const baloons = document.querySelector(".baloons");
  const originals = Array.from(baloons.children);
  // Wide screens have room for a second round. It starts halfway through the
  // list so the same photo never falls twice in a row
  if (window.innerWidth > 600) {
    const half = Math.ceil(originals.length / 2);
    originals
      .slice(half)
      .concat(originals.slice(0, half))
      .forEach(photo => baloons.appendChild(photo.cloneNode()));
  }

  const photos = baloons.querySelectorAll("img");
  // Shuffle the columns so photos falling one after another land far apart
  const columns = Array.from(photos, (_, i) => i).sort(() => Math.random() - 0.5);
  // However many photos there are, they all start falling within ~7 seconds
  const gap = 7 / photos.length;
  const rain = new TimelineMax();

  photos.forEach((photo, i) => {
    const fall = random(4.5, 6);
    const tilt = random(-20, 20);
    const swing = random(6, 14);
    const drift = random(25, 60);
    const start = i * gap + random(0, gap / 2);

    TweenMax.set(photo, {
      left: `${((columns[i] + 0.5) / photos.length) * 100}%`,
      xPercent: -50,
      y: -450
    });

    rain
      .to(
        photo,
        fall,
        {
          // Measured when the photo starts falling, so a resized or rotated screen still works
          y: () => window.innerHeight + 100,
          ease: Power0.easeNone
        },
        start
      )
      .fromTo(
        photo,
        fall / 3,
        { x: -drift, rotation: tilt - swing },
        {
          x: drift,
          rotation: tilt + swing,
          ease: Sine.easeInOut,
          repeat: 2,
          yoyo: true
        },
        start
      )
      // Hide it once it has landed, in case the screen grows taller afterwards
      .set(photo, { autoAlpha: 0 }, start + fall);
  });

  return rain;
};

// Animation Timeline
const animationTimeline = () => {
  // Spit chars that needs to be animated individually
  const textBoxChars = document.getElementsByClassName("hbd-chatbox")[0];
  const hbd = document.getElementsByClassName("wish-hbd")[0];

  textBoxChars.innerHTML = `<span>${textBoxChars.innerHTML
    .split("")
    .join("</span><span>")}</span`;

  hbd.innerHTML = `<span>${hbd.innerHTML
    .split("")
    .join("</span><span>")}</span`;

  const ideaTextTrans = {
    opacity: 0,
    y: -20,
    rotationX: 5,
    skewX: "15deg"
  };

  const ideaTextTransLeave = {
    opacity: 0,
    y: 20,
    rotationY: 5,
    skewX: "-15deg"
  };

  // Colors come from the night-sky palette in style/style.css
  const rootStyle = getComputedStyle(document.documentElement);
  const palette = name => rootStyle.getPropertyValue(`--${name}`).trim();

  const tl = new TimelineMax();

  tl
    .to(".container", 0.1, {
      visibility: "visible"
    })
    .from(".one", 0.7, {
      opacity: 0,
      y: 10
    })
    .from(".two", 0.4, {
      opacity: 0,
      y: 10
    })
    .to(
      ".one",
      0.7,
      {
        opacity: 0,
        y: 10
      },
      "+=2.5"
    )
    .to(
      ".two",
      0.7,
      {
        opacity: 0,
        y: 10
      },
      "-=1"
    )
    .from(".three", 0.7, {
      opacity: 0,
      y: 10
      // scale: 0.7
    })
    .to(
      ".three",
      0.7,
      {
        opacity: 0,
        y: 10
      },
      "+=2"
    )
    .from(".four", 0.7, {
      scale: 0.2,
      opacity: 0
    })
    .from(".fake-btn", 0.3, {
      scale: 0.2,
      opacity: 0
    })
    .staggerTo(
      ".hbd-chatbox span",
      0.5,
      {
        visibility: "visible"
      },
      0.05
    )
    .to(".fake-btn", 0.1, {
      backgroundColor: palette("lavender")
    })
    .to(
      ".four",
      0.5,
      {
        scale: 0.2,
        opacity: 0,
        y: -150
      },
      "+=0.7"
    )
    .from(".idea-1", 0.7, ideaTextTrans)
    .to(".idea-1", 0.7, ideaTextTransLeave, "+=1.5")
    .from(".idea-2", 0.7, ideaTextTrans)
    .to(".idea-2", 0.7, ideaTextTransLeave, "+=1.5")
    .from(".idea-3", 0.7, ideaTextTrans)
    .to(".idea-3 strong", 0.5, {
      scale: 1.2,
      x: 10,
      backgroundColor: palette("gold"),
      color: palette("night")
    })
    .to(".idea-3", 0.7, ideaTextTransLeave, "+=1.5")
    .from(".idea-4", 0.7, ideaTextTrans)
    .to(".idea-4", 0.7, ideaTextTransLeave, "+=1.5")
    .from(
      ".idea-5",
      0.7,
      {
        rotationX: 15,
        rotationZ: -10,
        skewY: "-5deg",
        y: 50,
        z: 10,
        opacity: 0
      },
      "+=0.5"
    )
    .to(
      ".idea-5 .smiley",
      0.7,
      {
        rotation: 90,
        x: 8
      },
      "+=0.4"
    )
    .to(
      ".idea-5",
      0.7,
      {
        scale: 0.2,
        opacity: 0
      },
      "+=2"
    )
    .staggerFrom(
      ".idea-6 span",
      0.8,
      {
        scale: 3,
        opacity: 0,
        rotation: 15,
        ease: Expo.easeOut
      },
      0.2
    )
    .staggerTo(
      ".idea-6 span",
      0.8,
      {
        scale: 3,
        opacity: 0,
        rotation: -15,
        ease: Expo.easeOut
      },
      0.2,
      "+=1"
    )
    .add(photoRain())
    .from(
      ".lydia-dp",
      0.5,
      {
        scale: 3.5,
        opacity: 0,
        x: 25,
        y: -25,
        rotationZ: -45
      },
      "-=2"
    )
    .from(".hat", 0.5, {
      x: -100,
      y: 350,
      rotation: -180,
      opacity: 0
    })
    .staggerFrom(
      ".wish-hbd span",
      0.7,
      {
        opacity: 0,
        y: -50,
        // scale: 0.3,
        rotation: 150,
        skewX: "30deg",
        ease: Elastic.easeOut.config(1, 0.5)
      },
      0.1
    )
    .staggerFromTo(
      ".wish-hbd span",
      0.7,
      {
        scale: 1.4,
        rotationY: 150
      },
      {
        scale: 1,
        rotationY: 0,
        color: palette("pink"),
        ease: Expo.easeOut
      },
      0.1,
      "party"
    )
    .from(
      ".wish h5",
      0.5,
      {
        opacity: 0,
        y: 10,
        skewX: "-15deg"
      },
      "party"
    )
    .staggerTo(
      ".eight svg",
      1.5,
      {
        visibility: "visible",
        opacity: 0,
        scale: 80,
        repeat: 3,
        repeatDelay: 1.4
      },
      0.3
    )
    .to(".six", 0.5, {
      opacity: 0,
      y: 30,
      zIndex: "-1"
    })
    .staggerFrom(".nine p", 1, ideaTextTrans, 1.2)
    .to(
      ".last-smile",
      0.5,
      {
        rotation: 90
      },
      "+=1"
    );

  // tl.seek("currentStep");
  // tl.timeScale(2);

  // Restart Animation on click
  const replyBtn = document.getElementById("replay");
  replyBtn.addEventListener("click", () => {
    tl.restart();
  });
};

// Light up the sky right away, then run fetch and animation in sequence
starrySky();
fetchData();