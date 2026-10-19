# Aksaya Dharani — Academic Portfolio

A single-page, cinematic portfolio for Aksaya Dharani, Assistant Professor (network security) at Velammal Engineering College, Chennai. It covers research and publications, teaching, education, projects, academic engagement, development and skills, all taken from her resume (`assets/Aksaya_Dharani_Resume.pdf`).

## Highlights

- **Hero:** a cut-out portrait leaning on the oversized name, over an interactive 3D network canvas (move the pointer to disturb it, click to send an attack path).
- **Motion:** preloader, word-by-word reveals, velocity-reactive marquees (the company marquee runs full width), parallax media and a pinned horizontal run through the projects.
- **Themes:** Midnight, Slate and Glacier tone switcher in the header (choice is remembered).
- **Command palette:** press `Ctrl K` (or use the Search button) to jump to any course, project or event.
- **Responsive and accessible:** works from phone to desktop, keeps a sensible heading order and honours `prefers-reduced-motion`.

## Run it

There is no build step. Serve the folder with any static server:

```sh
python3 -m http.server 8765
# then open http://127.0.0.1:8765/
```

Opening `index.html` straight from disk also works for most of the page, but a server is recommended.

## Structure

```
index.html        page content
styles.css        all styling and the three themes
script.js         animation, hero canvas, palette, theme switcher
assets/
  img/            photos, project images and the hero cut-out (aksaya-cutout.webp)
  gif/            animated diagrams
  fonts/          Hanken Grotesk and Newsreader (self-hosted)
  vendor/         GSAP, ScrollTrigger and Lenis (self-hosted)
tools/            helper scripts used to render the animated GIFs
```

## Editing

- **Content:** edit the sections in `index.html`.
- **Colours:** change the tone variables at the top of `styles.css` (`midnight`, `slate`, `glacier`).
- **Hero portrait:** replace `assets/img/aksaya-cutout.webp` with another transparent cut-out. The size is set by `--fw` on `.hero`, and the overlap with the name by the `padding-left` on `.hero-copy`.
- **Project images:** `assets/img/project-*.jpg`, plus `research-network.jpg` for the fifth project. They are tinted to the theme by CSS.

## Credits

- Photos are from [Unsplash](https://unsplash.com/), tinted to the site palette.
- Animation: [GSAP](https://gsap.com/) with ScrollTrigger, and [Lenis](https://lenis.darkroom.engineering/) for smooth scrolling.
- Fonts: Hanken Grotesk and Newsreader.
