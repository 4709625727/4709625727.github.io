# Vibrant Portfolio Template

A modern, vibrant, and fully customizable portfolio website template with a dark theme and dynamic gradient effects. Built with vanilla HTML, CSS, and JavaScript, featuring a JSON-driven architecture for easy content management.

## Features

- **Vibrant Dark Theme**: Modern dark theme with colorful gradients and animations
- **JSON-Driven Content**: All content is stored in JSON files for easy customization
- **Fully Responsive**: Mobile-first design that works on all devices
- **Particle Background**: Interactive particle effects using Particles.js
- **Smooth Animations**: Scroll reveal animations and smooth transitions
- **No Framework Required**: Pure vanilla JavaScript, HTML, and CSS
- **SEO Optimized**: Meta tags and semantic HTML for better search engine visibility
- **Easy to Customize**: Simple configuration through JSON files and CSS variables

## Quick Start

### Prerequisites

- A modern web browser
- A text editor (VS Code, Sublime Text, etc.)
- Basic knowledge of HTML, CSS, and JavaScript (optional)

### Installation

1. **Clone or Download** this repository:
   ```bash
   git clone <repository-url>
   cd vibrant-portfolio-template
   ```

2. **Open the project** in your favorite text editor

3. **Customize your content** by editing the JSON files in the `data/` folder

4. **Open `index.html`** in your browser to view your portfolio

### Local Development

For the best development experience, use a local server:

**Option 1: Using Python**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Option 2: Using Node.js (http-server)**
```bash
npm install -g http-server
http-server
```

**Option 3: Using VS Code**
- Install the "Live Server" extension
- Right-click on `index.html` and select "Open with Live Server"

Then open your browser and navigate to `http://localhost:8000`

## Customization Guide

### 1. Update Site Information

Edit `data/site-config.json` to update your site's metadata:

```json
{
  "title": "Your Name - Creative Portfolio",
  "description": "Your portfolio description",
  "author": "Your Name",
  "keywords": "your, keywords, here"
}
```

### 2. Customize Navigation

Edit `data/navigation.json` to update your navigation menu:

```json
{
  "brand": {
    "name": "Your Brand",
    "href": "#home"
  },
  "menuItems": [...]
}
```

### 3. Update Hero Section

Edit `data/hero.json` to personalize your landing page:

```json
{
  "greeting": "Hello, I'm",
  "name": "Your Name",
  "title": "Your Title",
  "tagline": "Your tagline",
  "summary": "Your summary..."
}
```

### 4. Add Your Experience

Edit `data/experience.json` to add your work experience:

```json
{
  "experiences": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "period": "Jan 2020 - Present",
      "description": "Job description...",
      "responsibilities": [...],
      "technologies": [...]
    }
  ]
}
```

### 5. Showcase Your Skills

Edit `data/skills.json` to list your technical skills:

```json
{
  "categories": [
    {
      "category": "Frontend Development",
      "icon": "fas fa-palette",
      "color": "#FF6B6B",
      "skills": ["HTML5", "CSS3", "JavaScript", ...]
    }
  ]
}
```

### 6. Add Your Projects

Edit `data/projects.json` to showcase your work:

```json
{
  "projects": [
    {
      "title": "Project Name",
      "description": "Project description...",
      "technologies": [...],
      "links": {
        "github": "https://github.com/...",
        "demo": "https://..."
      }
    }
  ]
}
```

### 7. Update Education & Certifications

Edit `data/education.json` to add your educational background:

```json
{
  "education": [...],
  "certifications": [...]
}
```

### 8. Setup Contact Form

Edit `data/contact.json` to configure your contact information:

```json
{
  "contactInfo": [...],
  "form": {
    "action": "https://formspree.io/f/your-form-id",
    "method": "POST",
    ...
  }
}
```

**Note**: To enable the contact form, sign up at [Formspree](https://formspree.io/) and replace `your-form-id` with your actual form ID.

### 9. Customize Colors

Edit CSS variables in `assets/css/styles.css`:

```css
:root {
  --color-bg-dark: #0a0e27;
  --color-accent-1: #FF6B6B;
  --color-accent-2: #4ECDC4;
  /* ... more colors */
}
```

### 10. Update Footer

Edit `data/footer.json` to customize your footer:

```json
{
  "copyright": {
    "text": "© 2024 Your Name. All rights reserved.",
    "year": "2024"
  },
  "tagline": "Crafted with passion and coffee ☕"
}
```

## Project Structure

```
vibrant-portfolio-template/
├── assets/
│   ├── css/
│   │   └── styles.css           # All styling
│   └── js/
│       └── main.js              # Core application logic
├── data/
│   ├── site-config.json         # SEO & meta tags
│   ├── navigation.json          # Navigation menu
│   ├── hero.json                # Hero section
│   ├── about.json               # About section
│   ├── experience.json          # Work experience
│   ├── skills.json              # Skills & technologies
│   ├── projects.json            # Projects showcase
│   ├── education.json           # Education & certifications
│   ├── contact.json             # Contact information
│   └── footer.json              # Footer content
├── index.html                   # Main HTML file
├── package.json                 # Project metadata
└── README.md                    # This file
```

## Deployment

### GitHub Pages

1. Push your code to a GitHub repository
2. Go to Settings → Pages
3. Select the main branch as the source
4. Your site will be available at `https://yourusername.github.io/repository-name`

### Netlify

1. Push your code to GitHub/GitLab
2. Go to [Netlify](https://netlify.com)
3. Click "New site from Git"
4. Select your repository
5. Click "Deploy site"

### Vercel

1. Push your code to GitHub/GitLab
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Click "Deploy"

## Technologies Used

- **HTML5**: Semantic markup
- **CSS3**: Modern styling with CSS variables, Grid, and Flexbox
- **JavaScript (ES6+)**: Vanilla JavaScript for interactivity
- **Particles.js**: Interactive particle background
- **Font Awesome**: Icon library
- **Google Fonts**: Poppins and Playfair Display

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Opera (latest)

## Performance

- Lightweight: ~50KB total (without images)
- Fast load times
- Optimized animations
- Mobile-first responsive design

## Accessibility

- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- High contrast colors for readability

## License

This project is open source and available under the [MIT License](LICENSE).

## Credits

- Design & Development: [Your Name]
- Icons: [Font Awesome](https://fontawesome.com/)
- Fonts: [Google Fonts](https://fonts.google.com/)
- Particles: [Particles.js](https://vincentgarreau.com/particles.js/)

## Support

If you have any questions or need help customizing this template, please:

1. Check the documentation above
2. Review the JSON file comments (\_instructions)
3. Open an issue on GitHub

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Made with ❤️ and lots of coffee**

If you found this template helpful, please give it a star ⭐
