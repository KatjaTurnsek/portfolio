import gsap from "gsap";
import SplitType from "split-type";

export function animateTextInSection(section) {
  if (!section) return;

  // Animate all H1s
  const h1s = section.querySelectorAll("h1");
  h1s.forEach((heading) => {
    document.fonts.ready.then(() => {
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
    });
  });

  // Animate other headings (h2, h3, h4)
  const headings = section.querySelectorAll("h2, h3, h4");
  headings.forEach((el) => {
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
  });

  // Animate paragraphs
  const paragraphs = section.querySelectorAll("p");
  paragraphs.forEach((el) => {
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
  });
}
