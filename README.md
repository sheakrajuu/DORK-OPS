# Dork Ops

Dork Ops is a browser-based collection of public-search tools, command builders, and security-tool references. It is intended for learning and authorized research. The site is made with plain HTML, CSS, and JavaScript and does not require a build step or package installation.

## Pages and features

- **Google Dorking Lab** (`dork-engine.html`) — build focused Google queries using selected operators and scope.
- **Image Lookup** — prepare reverse-image lookup links for third-party services.
- **Nmap Lab** — compose Nmap commands for authorized network discovery and assessment.
- **Password Tools Lab** — prepare example commands for Hydra, John the Ripper, and Hashcat.
- **Search Operators** (`search-operators.html`) — browse and filter a reference catalog of search operators.
- **Nmap Options** (`nmap-reference.html`) — browse Nmap command-line options.
- **Password Tool Options** (`password-tools.html`) — browse options for password-auditing tools.
- **Kali Tools** (`kali-tools.html`) — browse a directory of Kali Linux tools and documentation.
- **About** (`about.html`) and **Terms of Use** (`terms.html`) — project information, contribution guidance, and usage terms.

The command builders generate text; they do not execute commands on your device. Search and image lookup links open external services, which may receive the query or URL you submit.

## Run locally

No dependencies or build process are required.

1. Download or clone the project.
2. Open `dork-engine.html` in a modern browser.
3. Use the navigation to open the labs and reference pages.

Alternatively, serve the project directory with any static web server and open its `dork-engine.html` page. Serving over HTTP is useful for testing site behavior in a browser.

## Project files

- `dork-engine.html` — main page and interactive labs.
- `search-operators.html`, `nmap-reference.html`, `password-tools.html`, `kali-tools.html` — reference and directory pages.
- `about.html`, `terms.html` — project information and terms.
- `styles.css` — shared site styling and responsive layout.
- `script.js` — Google Dorking, Image Lookup, and Nmap lab behavior.
- `password-tools.js` — Password Tools Lab behavior.
- `recommendations.js` — related suggestions shown by the labs.
- `operators.js`, `nmap.js`, `kali-tools.js` — reference-page data and interactions.
- `mascot.js` — mascot messages and rotating project highlights.

## Responsible use

Only investigate domains, networks, services, accounts, images, and files that you own or are explicitly authorized to assess. You are responsible for complying with applicable laws, agreements, and third-party service terms. Tool syntax and search behavior may change; verify important details against current official documentation before use.

## Contributing

Contributions from everyone are welcome, including bug reports, corrections, documentation, accessibility improvements, and code changes. Visit the [Dork Ops GitHub project](https://github.com/sheakrajuu/DORK-OPS) to open an issue or submit a pull request. Please keep contributions constructive and consistent with the project's authorized-use focus.
