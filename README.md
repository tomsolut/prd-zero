# PRD-Zero 🚀

> MVP planning tool for solo developers - from idea to PRD in 70 minutes

[![npm version](https://img.shields.io/npm/v/prd-zero.svg)](https://www.npmjs.com/package/prd-zero)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

## 🎯 What is PRD-Zero?

PRD-Zero is a command-line tool designed to help solo developers and small teams overcome analysis paralysis and quickly transform ideas into actionable Product Requirements Documents (PRDs) and development roadmaps.

### Key Features

- **⏱️ Time-boxed Sessions**: Complete your planning in 70 minutes or less
- **📋 Structured Workflow**: Guided questions that prevent overthinking
- **📄 Professional Output**: Generates comprehensive PRD and roadmap documents
- **🎨 Customizable Templates**: Use built-in or custom Handlebars templates
- **💾 Session Management**: Save and resume planning sessions
- **🤖 AI Assistance** (Optional): Get intelligent suggestions powered by Anthropic Claude
- **🌍 Cross-platform**: Works on Windows, macOS, and Linux

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g prd-zero
```

### Local Installation

```bash
npm install prd-zero
```

### From Source

```bash
git clone https://github.com/tomsolut/prd-zero.git
cd prd-zero
npm install
npm run build
npm link
```

## 🚀 Quick Start

Start a new MVP planning session:

```bash
prd-zero init
```

This will launch an interactive session that guides you through:

1. **Project Information** - Name, description, target audience
2. **MVP Scope** - Core features, success metrics, constraints
3. **Timeline** - Development phases and milestones
4. **Technical Stack** - Technology choices
5. **Risk Assessment** - Identify and mitigate risks
6. **Next Steps** - Immediate action items

## 📖 Usage

### Basic Commands

```bash
# Start a new planning session
prd-zero init

# Start with custom time limit (default: 70 minutes)
prd-zero init --time-limit 45

# Specify output directory
prd-zero init --output ./my-project

# Skip introduction
prd-zero init --skip-intro

# Enable AI assistance (requires ANTHROPIC_API_KEY)
prd-zero init --ai
```

### Session Types

PRD-Zero offers two session types:

#### Complete Planning (45-70 minutes)
Comprehensive PRD with all details including:
- Detailed project information
- Complete MVP scope definition
- Custom timeline and phases
- Technical architecture decisions
- Risk assessment and mitigation
- Assumptions and open questions

#### Quick Start (10-15 minutes)
Essential information only:
- Basic project information
- Core features (3-5)
- Standard timeline templates
- Common tech stack options

### Output Files

PRD-Zero generates two main documents:

#### 1. Product Requirements Document (PRD)
- `prd_[project-name]_[timestamp].md` - Markdown format
- `prd_[project-name]_[timestamp].json` - JSON data

#### 2. Development Roadmap
- `roadmap_[project-name]_[timestamp].md` - Includes sprint plan and Gantt chart

### Advanced Features

#### Resume a Session (Coming Soon)
```bash
prd-zero resume ./outputs/session_2024-01-15.json
```

#### Template Management (Coming Soon)
```bash
# List available templates
prd-zero templates --list

# Add custom template
prd-zero templates --add ./my-template.hbs
```

## 🛠️ Configuration

### Environment Variables

```bash
# Enable debug mode
DEBUG=true prd-zero init

# Set Anthropic API key for AI features
export ANTHROPIC_API_KEY="your-api-key"
```

### Custom Templates

Create your own Handlebars templates and place them in the `templates/` directory.

## 📊 Example Output

### PRD Sample

```markdown
# Product Requirements Document (PRD)

## Project: TaskFlow Pro

**Generated:** 2024-01-15 10:30 AM
**Session Duration:** 45 minutes

### Executive Summary
A task management app designed for freelancers to track projects, 
time, and invoices in one place...

### Core Features
1. Project dashboard with kanban boards
2. Time tracking with Pomodoro timer
3. Invoice generation from tracked time
4. Client portal for project updates
...
```

### Roadmap Sample

```markdown
# Development Roadmap

## Sprint 1: Planning & Design
**Duration:** Week 1-2
**Goals:**
- [ ] Complete technical architecture
- [ ] Design UI mockups
- [ ] Set up development environment
...
```

## 🧪 Development

### Prerequisites

- Node.js 18+
- npm 9+
- TypeScript 5+

### Setup

```bash
# Clone repository
git clone https://github.com/tomsolut/prd-zero.git
cd prd-zero

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

### Project Structure

```
prd-zero/
├── src/
│   ├── commands/       # CLI commands
│   ├── questions/      # Interactive prompts
│   ├── validators/     # Input validation
│   ├── generators/     # Document generators
│   ├── utils/          # Utility functions
│   └── types/          # TypeScript types
├── templates/          # Document templates
├── schemas/            # JSON schemas
└── outputs/           # Generated documents
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Write TypeScript with strict mode enabled
- Follow ESLint rules
- Add tests for new features
- Update documentation as needed
- Keep commits atomic and descriptive

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Commander.js](https://github.com/tj/commander.js/) for CLI framework
- [Inquirer.js](https://github.com/SBoudrias/Inquirer.js/) for interactive prompts
- [Handlebars](https://handlebarsjs.com/) for template generation
- [Chalk](https://github.com/chalk/chalk) for terminal styling
- [Ora](https://github.com/sindresorhus/ora) for elegant spinners

## 🐛 Troubleshooting

### Common Issues

#### Permission Denied
```bash
# On Unix systems, make the file executable
chmod +x dist/index.js
```

#### Command Not Found
```bash
# Ensure npm global bin is in your PATH
npm config get prefix
# Add the bin directory to your PATH
```

#### Template Not Found
```bash
# Ensure output directory exists
mkdir -p outputs
```

## 📬 Support

- **Issues**: [GitHub Issues](https://github.com/tomsolut/prd-zero/issues)
- **Discussions**: [GitHub Discussions](https://github.com/tomsolut/prd-zero/discussions)
- **Email**: tb@tomsolut.de

## 🚀 Roadmap

- [ ] Session save/resume functionality
- [ ] Custom template management
- [ ] Export to different formats (PDF, HTML)
- [ ] Integration with project management tools
- [ ] Team collaboration features
- [ ] Web-based version
- [ ] VS Code extension

---

**Built with ❤️ by [Thomas Bieth](https://github.com/tomsolut)**

*Stop overthinking, start building!*