import gsap from "gsap";
import SplitType from "split-type";

export function animateTextInSection(section) {
  if (!section) return;

  // Animate all H1s
  const h1s = section.querySelectorAll("h1");
  h1s.forEach((heading) => {
    document.fonts.ready.then(() => {
      try {
        const split = new SplitType(heading, {
          types: "words",
          tagName: "span",
        });

        const words = split.words;
        gsap.set(heading, { opacity: 1 });

        gsap.fromTo(
          words,
          {
            y: 60,
            opacity: 0,
            scale: 0.85,
          },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            ease: "elastic.out(1, 0.4)",
            duration: 2.2,
            stagger: 0.06,
            onComplete: () => {
              split.revert();
            },
          }
        );
      } catch {
        // Graceful fallback
        heading.style.opacity = 1;
      }
    });
  });

  // Animate h2, h3, h4
  const headings = section.querySelectorAll("h2, h3, h4");
  headings.forEach((el) => {
    try {
      const split = new SplitType(el, { types: "lines", tagName: "span" });

      gsap.set(split.lines, { yPercent: 100, opacity: 0 });

      gsap.to(split.lines, {
        yPercent: 0,
        opacity: 1,
        duration: 1.6,
        ease: "power2.out",
        stagger: 0.15,
        onComplete: () => split.revert(),
      });
    } catch {
      el.style.opacity = 1;
    }
  });

  // Animate paragraphs
  const paragraphs = section.querySelectorAll("p");
  paragraphs.forEach((el) => {
    try {
      const split = new SplitType(el, { types: "lines", tagName: "span" });

      gsap.set(split.lines, { yPercent: 100, opacity: 0 });

      gsap.to(split.lines, {
        yPercent: 0,
        opacity: 1,
        duration: 1.8,
        ease: "power2.out",
        stagger: 0.18,
        delay: 0.2,
        onComplete: () => split.revert(),
      });
    } catch {
      el.style.opacity = 1;
    }
  });
}

// Animate menu links
export function animateMenuLinks() {
  const links = document.querySelectorAll(".fullscreen-menu nav a");

  links.forEach((link) => {
    try {
      SplitType.revert(link);
      link.classList.remove("animated");

      const split = new SplitType(link, {
        types: "words",
        tagName: "span",
      });

      const words = split.words;
      link.classList.add("animated");

      gsap.fromTo(
        words,
        {
          y: 50,
          opacity: 0,
          scale: 0.9,
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1.5,
          ease: "back.out(1.7)",
          stagger: 0.1,
        }
      );
    } catch {
      link.style.opacity = 1;
    }
  });
}
