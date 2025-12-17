# essay_writer.py
import os
import sys
from openai import OpenAI

def require_env(name: str) -> str:
    v = os.getenv(name)
    if not v:
        print(f"Missing {name}. Set it like: export {name}='...'", file=sys.stderr)
        sys.exit(1)
    return v

def main():
    # 1) Read input
    title = input("Essay topic/title: ").strip()
    if not title:
        print("No title given. Exiting.", file=sys.stderr)
        sys.exit(1)

    # Optional knobs
    word_count = input("Target word count (e.g. 800) [press Enter for 800]: ").strip() or "800"
    tone = input("Tone (e.g. academic, casual, persuasive) [Enter = academic]: ").strip() or "academic"

    # 2) Init client (expects OPENAI_API_KEY in env)
    require_env("OPENAI_API_KEY")
    client = OpenAI()

    # 3) Prompt
    prompt = f"""
Write a {tone} essay titled: "{title}".

Constraints:
- Approximately {word_count} words.
- Clear thesis in the introduction.
- Use headings.
- Use concrete examples.
- End with a strong conclusion.
"""

    # 4) Call OpenAI
    resp = client.responses.create(
        model="gpt-4.1-mini",
        input=prompt,
    )

    # 5) Output
    essay = resp.output_text.strip()
    print("\n" + "=" * 60)
    print(essay)
    print("=" * 60 + "\n")

if __name__ == "__main__":
    main()
