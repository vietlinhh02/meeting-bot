# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

Please report (suspected) security vulnerabilities to **vietlinhh02** via GitHub issues (use the security label) or contact through GitHub profile. You will receive a response within 48 hours. If the issue is confirmed, we will release a patch as soon as possible depending on complexity but historically within a few days.

### Reporting Process

1. **Do not** open a public GitHub issue for security vulnerabilities
2. Email the security team with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
3. Wait for acknowledgment and further instructions
4. Do not disclose the vulnerability publicly until it has been addressed

### What to Include

When reporting a security vulnerability, please include:

- Type of vulnerability (e.g., XSS, SQL injection, etc.)
- Full paths of source file(s) related to the vulnerability
- Location of the affected code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Security Best Practices

When using this project:

- Keep dependencies up to date
- Review and audit your configuration files
- Use environment variables for sensitive data
- Follow the principle of least privilege
- Regularly review access logs and audit trails
- Implement proper authentication and authorization
- Use HTTPS/TLS for all network communications
- Sanitize all user inputs
- Validate data on both client and server side

### Known Security Considerations

- API keys and secrets should never be committed to version control
- Ensure proper CORS configuration in production
- Implement rate limiting for API endpoints
- Use secure session management
- Regularly update dependencies to patch known vulnerabilities

## Disclosure Policy

When we receive a security bug report, we will:

1. Confirm the issue and determine affected versions
2. Audit code to find any potential similar problems
3. Prepare fixes for all releases still under maintenance
4. Release a security update addressing the vulnerability
5. Publicly disclose the vulnerability after a patch is available

We appreciate your efforts to responsibly disclose your findings and will make every effort to acknowledge your contributions.

