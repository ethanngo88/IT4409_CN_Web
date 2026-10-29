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

// Area two rectangles ({ left, right, top, bottom }) have in common
const overlapArea = (a, b) =>
  Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
  Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

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

// Photo rain: each photo falls from the top with its own size, tilt and sway
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
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  // Every photo falls at the same steady speed, so photos never move relative to each other:
  // however they overlap when one starts falling is how they overlap all the way down
  const speed = Math.max(screenHeight, 700) / 5;
  const placed = [];
  let start = 0;
  const rain = new TimelineMax();

  photos.forEach((photo, i) => {
    // Each photo gets its own size, from a bit smaller to a bit bigger than the base one
    photo.style.setProperty("--size", random(0.8, 1.3));
    const width = photo.offsetWidth;
    // A photo with no width / height in index.html that hasn't loaded yet has no height
    // so far, so guess it is a portrait one
    const height = photo.offsetHeight > width / 2 ? photo.offsetHeight : width * 1.4;
    const top = -height - 50;
    const fall = (screenHeight + 50 - top) / speed;
    // Start often enough that the photos on screen add up to about its whole area
    const onScreen = (screenWidth * screenHeight) / (width * height);
    start += (random(0.5, 1.5) * fall) / onScreen;

    // How much of this photo, and of its face area (the upper middle), the photos that
    // started before it would cover if it fell centred at x. Those stay on top of it
    const cover = x => {
      const box = { left: x - width / 2, right: x + width / 2, top, bottom: top + height };
      const face = {
        left: x - width * 0.3,
        right: x + width * 0.3,
        top: top + height * 0.05,
        bottom: top + height * 0.55
      };
      let all = 0;
      let onFace = 0;
      placed.forEach(other => {
        const otherTop = other.top + speed * (start - other.start);
        const otherBox = {
          left: other.x - other.width / 2,
          right: other.x + other.width / 2,
          top: otherTop,
          bottom: otherTop + other.height
        };
        // Sway and tilt move the edges and corners around, so keep the face well clear
        const pad = 25;
        all += overlapArea(box, otherBox);
        onFace += overlapArea(face, {
          left: otherBox.left - pad,
          right: otherBox.right + pad,
          top: otherBox.top - pad,
          bottom: otherBox.bottom + pad
        });
      });
      return {
        all: all / (width * height),
        face: onFace / (width * 0.6 * height * 0.5)
      };
    };

    // Try spots across the screen (a photo may hang a little off either side), keep the
    // ones that leave the face clear and cover at most 35% of the photo, and take the one
    // closest to a random amount of overlap
    let spot = null;
    while (!spot) {
      const target = random(0.05, 0.3);
      for (let tries = 0; tries < 15; tries++) {
        const x = random(width * 0.3, screenWidth - width * 0.3);
        const covered = cover(x);
        if (
          covered.face < 0.05 &&
          covered.all < 0.35 &&
          (!spot || Math.abs(covered.all - target) < Math.abs(spot.all - target))
        ) {
          spot = { x, all: covered.all };
        }
      }
      // Nowhere fits yet: wait a moment for the photos ahead to move further down
      if (!spot) start += 0.1;
    }
    const { x } = spot;
    placed.push({ x, width, height, top, start });

    const tilt = random(-15, 15);
    const swing = random(3, 6);
    const drift = random(5, 15);

    TweenMax.set(photo, {
      left: `${(x / screenWidth) * 100}%`,
      xPercent: -50,
      y: top,
      // Photos that started earlier are lower down the screen and stay on top
      zIndex: photos.length - i
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

// Hand-written letter: letterText from customize.json appears one character at a time, as if
// being written, lingering a little at punctuation and line breaks
const writeLetter = () => {
  const card = document.querySelector(".letter-card");
  const text = document.querySelector(".letter-text");
  // Seconds between two characters: lower writes faster
  const pace = 0.05;

  // fetchData puts the text in with innerText, which turns every line break into a <br>
  const content = Array.from(text.childNodes)
    .map(node => (node.nodeName === "BR" ? "\n" : node.textContent))
    .join("")
    .normalize("NFC");
  // One piece per character as the eye sees it, so emoji and accented letters stay whole
  const chars =
    window.Intl && Intl.Segmenter
      ? Array.from(new Intl.Segmenter().segment(content), part => part.segment)
      : Array.from(content);

  // Keep the newest character in sight when the letter is taller than the card
  const keepInView = span => {
    const margin = 20;
    const bottom = span.offsetTop + span.offsetHeight + margin;
    if (bottom > card.scrollTop + card.clientHeight) {
      card.scrollTop = bottom - card.clientHeight;
    } else if (span.offsetTop - margin < card.scrollTop) {
      card.scrollTop = span.offsetTop - margin;
    }
  };

  text.textContent = "";
  const writing = new TimelineMax();
  let time = 0;
  chars.forEach(char => {
    const span = document.createElement("span");
    span.textContent = char;
    text.appendChild(span);
    writing.to(span, 0.4, { opacity: 1, onStart: () => keepInView(span) }, time);
    time += pace * (/\n/.test(char) ? 12 : /[.!?…]/.test(char) ? 8 : /[,;:]/.test(char) ? 4 : 1);
  });

  return writing;
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

// Hold the timeline until the viewer taps the element, then carry on
const waitForTap = (selector, timeline, onTap = () => {}) => {
  document.querySelector(selector).addEventListener(
    "click",
    () => {
      onTap();
      timeline.resume();
    },
    { once: true }
  );
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
    // Hand-written letter: the envelope bobs until it is tapped, then opens and the letter
    // inside is written out. The story waits again until "Đọc xong rồi" is tapped
    .fromTo(
      ".envelope-wrap",
      0.8,
      { autoAlpha: 0, y: 60, scale: 0.8 },
      { autoAlpha: 1, y: 0, scale: 1, ease: Back.easeOut }
    )
    .addPause("+=0.2", () => {
      const bob = TweenMax.to(".envelope", 0.8, {
        y: -10,
        rotation: 2,
        ease: Sine.easeInOut,
        repeat: -1,
        yoyo: true
      });
      waitForTap(".envelope-wrap", tl, () => {
        bob.kill();
        TweenMax.to(".envelope", 0.2, { y: 0, rotation: 0 });
      });
    })
    .to(".letter-hint", 0.3, { autoAlpha: 0 })
    .to(".envelope-seal", 0.3, { scale: 0, opacity: 0, ease: Back.easeIn }, "-=0.2")
    .to(".envelope-flap", 0.6, { rotationX: 180, ease: Power2.easeInOut })
    // Past halfway the open flap goes behind the letter
    .set(".envelope-flap", { zIndex: 1 }, "-=0.3")
    .to(".envelope-paper", 0.7, { yPercent: -55, ease: Power2.easeOut })
    .to(".envelope-wrap", 0.6, { autoAlpha: 0, y: 120, ease: Power2.easeIn }, "+=0.2")
    .fromTo(
      ".letter-sheet",
      0.9,
      { autoAlpha: 0, scale: 0.4, y: -40 },
      { autoAlpha: 1, scale: 1, y: 0, ease: Back.easeOut.config(1.2) },
      "-=0.4"
    )
    .add(writeLetter())
    .fromTo(".letter-next", 0.5, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0 }, "+=0.5")
    .addPause("+=0", () => waitForTap(".letter-next", tl))
    .to(".letter", 0.6, { autoAlpha: 0, y: -30 })
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