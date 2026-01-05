# Contributing to Meeting Bot

Thank you for your interest in contributing to Meeting Bot!

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) before participating.

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Environment details (OS, Node.js version, etc.)

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md) when creating issues.

### Suggesting Features

Feature requests are welcome. Please include:

- A clear description of the feature
- Use case and motivation
- Possible implementation approach (if you have ideas)

Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md) when creating issues.

### Pull Requests

1. **Fork the repository** and create a new branch from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the code style guidelines

3. **Commit your changes** with clear messages following the commit convention
   ```bash
   git commit -m "feat: add new feature description"
   ```

4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request** with:
   - Clear description of changes
   - Reference to related issues
   - Screenshots or examples if applicable

## Code Style Guidelines

### JavaScript Style

- Use ES6+ features and ES modules
- Follow consistent code formatting
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and single-purpose

### Code Formatting

This project uses ESLint and Prettier for code formatting. Run:

```bash
npm run lint
npm run format
```

### Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependency updates

**Examples:**
```
feat(recording): add automatic meeting recording
fix(transcription): fix encoding issue in speech-to-text conversion
docs(readme): update installation instructions
```

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/meeting-bot.git
   cd meeting-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

## Testing

- Write tests for new features
- Ensure all existing tests pass
- Maintain or improve test coverage
- Test on different environments when possible

## Code Review Process

- All pull requests require review before merging
- Be open to feedback and ready to make changes
- Ensure code is well-tested before submitting
- Respond to review comments in a timely manner

## Questions?

If you have any questions, please:
- Open an issue for discussion
- Contact the maintainers
- Check existing documentation

Thank you for contributing!

