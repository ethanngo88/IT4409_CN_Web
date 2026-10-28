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

// Photo rain: each photo falls from the top with its own tilt and sway
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
  const photoWidth = photos[0].offsetWidth;
  // The screen is split into lanes a little wider than a photo, and a photo only follows
  // another one down the same lane once there is room, so they rarely cover each other
  const lanes = Math.max(2, Math.floor(window.innerWidth / (photoWidth * 1.2)));
  const laneWidth = window.innerWidth / lanes;
  // Every photo falls at the same steady speed, so none catches up with the one ahead of it
  const speed = Math.max(window.innerHeight, 700) / 5;
  // When each lane is free for its next photo, staggered so the first ones don't drop in a row
  const laneFree = Array.from({ length: lanes }, () => random(0, 1.5));
  let lastLane = -1;
  const rain = new TimelineMax();

  photos.forEach(photo => {
    // A photo with no width / height in index.html that hasn't loaded yet has no height
    // so far, so guess it is a portrait one
    const height = photo.offsetHeight > photoWidth / 2 ? photo.offsetHeight : photoWidth * 1.4;
    // Take one of the lanes that frees up soonest, but not the one used last time
    const open = laneFree.map((_, lane) => lane).filter(lane => lane !== lastLane);
    const soonest = Math.min(...open.map(lane => laneFree[lane]));
    const choices = open.filter(lane => laneFree[lane] < soonest + 0.5);
    const lane = choices[Math.floor(Math.random() * choices.length)];
    const start = laneFree[lane] + random(0, 0.3);
    const top = -height - 50;
    const fall = (window.innerHeight + 50 - top) / speed;
    const tilt = random(-6, 6);
    const swing = random(3, 5);
    // Sway within the room the lane leaves on either side of the photo
    const drift = (random(0.5, 1) * (laneWidth - photoWidth)) / 2;

    // The next photo can enter this lane once this one has moved down its own height and a
    // random gap, so the lanes don't look like conveyor belts
    laneFree[lane] = start + (height + random(40, 140)) / speed;
    lastLane = lane;

    TweenMax.set(photo, {
      left: `${((lane + 0.5) / lanes) * 100}%`,
      xPercent: -50,
      y: top
    });

    rain
      .to(
        photo,
        fall,
        {
          // Measured when the photo starts falling, so a resized or rotated screen still works
          y: () => window.innerHeight + 50,
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

// Video after "Send": the timeline is paused while it plays and resumes when it ends.
// Browsers may refuse sound until the viewer has touched the page, so it falls back to
// playing muted and the first tap anywhere turns the sound on
const playClip = timeline => {
  const video = document.querySelector(".clip video");
  const hint = document.querySelector(".clip-hint");
  const resume = () => timeline.resume();

  video.onended = resume;
  video.currentTime = 0;
  video.muted = false;
  hint.style.visibility = "hidden";
  video
    .play()
    .catch(() => {
      video.muted = true;
      hint.style.visibility = "visible";
      document.addEventListener(
        "click",
        () => {
          video.muted = false;
          hint.style.visibility = "hidden";
        },
        { once: true }
      );
      return video.play();
    })
    // Can't play at all (missing file, power saving mode...): skip it instead of getting stuck
    .catch(resume);
};

// Animation Timeline
const animationTimeline = () => {
  // Spit chars that needs to be animated individually
  const textBoxChars = document.getElementsByClassName("hbd-chatbox")[0];
  const hbd = document.getElementsByClassName("wish-hbd")[0];
  const ahem = document.getElementsByClassName("ahem")[0];

  textBoxChars.innerHTML = `<span>${textBoxChars.innerHTML
    .split("")
    .join("</span><span>")}</span`;

  hbd.innerHTML = `<span>${hbd.innerHTML
    .split("")
    .join("</span><span>")}</span`;

  ahem.innerHTML = `<span>${ahem.innerHTML
    .split("")
    .join("</span><span>")}</span>`;

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
    // "Search result": the video pops up and the timeline waits for it to finish
    .from(".clip", 0.7, {
      scale: 0.6,
      opacity: 0,
      y: 40,
      ease: Back.easeOut
    })
    .addPause("+=0.3", () => playClip(tl))
    // Wrong video! Fling it off to the side
    .to(
      ".clip",
      0.5,
      {
        xPercent: -60,
        rotation: -15,
        opacity: 0,
        ease: Back.easeIn
      },
      "+=0.3"
    )
    // "À chết nhầm...": drops in with a bounce, shakes its head, then falls away
    .from(".oops", 0.8, {
      opacity: 0,
      y: -80,
      ease: Bounce.easeOut
    })
    .to(
      ".oops",
      0.08,
      {
        x: 12,
        repeat: 7,
        yoyo: true
      },
      "+=0.3"
    )
    .to(
      ".oops",
      0.5,
      {
        opacity: 0,
        y: 60,
        rotation: 10,
        ease: Power2.easeIn
      },
      "+=1.2"
    )
    // "E hèm...": letters pop up one by one, then a little throat-clearing pulse
    .staggerFrom(
      ".ahem span",
      0.4,
      {
        opacity: 0,
        y: 20,
        ease: Back.easeOut
      },
      0.12
    )
    .to(
      ".ahem",
      0.12,
      {
        scale: 1.15,
        repeat: 3,
        yoyo: true
      },
      "+=0.3"
    )
    .to(".ahem", 0.7, ideaTextTransLeave, "+=1")
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