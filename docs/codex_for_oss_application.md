# Codex for OSS Application Draft

Use this draft for the OpenAI Codex for OSS application form:

https://openai.com/form/codex-for-oss/

## Repository URL

TODO: Add the public GitHub repository URL after publishing the project.

## Maintainer Role

Primary maintainer.

## Why does this repository qualify?

TTS Studio is an open-source desktop voiceover workstation for long-form text-to-speech production. It combines a React/TypeScript/Electron desktop UI with a task queue, long-text segmentation, retryable generation jobs, MP3/WAV export, and local output management.

The project has a clear practical use case for creators, educators, editors, and developers who need a local-first workflow for generating voiceover audio from longer scripts. It is actively maintained, with ongoing work on UI polish, desktop packaging, output reliability, API-provider configuration, and test coverage.

As the primary maintainer, I review and improve the product architecture, fix generation and packaging issues, maintain documentation, and prepare the project for community contributions. Codex would directly help with issue triage, code review, test generation, documentation improvements, refactoring, and security hardening.

## How will you use API credits for your project?

I will use API credits to improve maintainer workflows for the open-source project, including:

- Reviewing pull requests and identifying risky changes.
- Generating focused tests for the generation queue, file output, and Electron bridge.
- Improving documentation for setup, API configuration, and desktop packaging.
- Triaging issues and turning bug reports into reproducible test cases.
- Auditing security-sensitive areas such as local API-key handling, Electron preload boundaries, and file-system writes.
- Prototyping contributor tools that help users validate TTS provider configuration without exposing secrets.

## Codex Security Request

I would like access to Codex Security if available. The project includes Electron desktop code, local file-system access, user-provided API keys, and generated media output, so automated security review would be valuable for preventing unsafe preload exposure, accidental secret leaks, and insecure file handling.

## Notes Before Submitting

- Publish the repository publicly on GitHub.
- Confirm there are no committed API keys or generated output files.
- Add accurate maintainer identity, ChatGPT email, GitHub username, and OpenAI organization ID.
- Add real usage signals if available: stars, downloads, users, issues, pull requests, or release history.
