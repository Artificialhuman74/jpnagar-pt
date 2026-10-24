"""Ensure the consent audit text matches the label patients see on both booking pages."""
from html.parser import HTMLParser
from pathlib import Path
import re


class ConsentLabels(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.labels = []
        self.current = None

    def handle_starttag(self, tag, attrs):
        if tag == "label" and dict(attrs).get("for") == "wa-consent":
            self.current = []

    def handle_data(self, text):
        if self.current is not None:
            self.current.append(text)

    def handle_endtag(self, tag):
        if tag == "label" and self.current is not None:
            self.labels.append("".join(self.current).strip())
            self.current = None


def check(root):
    source = (root / "wp/jpnagar-clinic/includes/whatsapp.php").read_text()
    match = re.search(r"^const JPN_WA_CONSENT_TEXT = '((?:\\.|[^'\\])*)';$", source, re.M)
    if not match:
        raise SystemExit("Cannot read JPN_WA_CONSENT_TEXT for the consent wording check.")
    text = re.sub(r"\\(['\\])", r"\1", match[1])
    for page in ("demo/desktop/book.html", "demo/mobile/book.html"):
        parser = ConsentLabels()
        parser.feed((root / page).read_text())
        if not text or parser.labels != [text]:
            raise SystemExit(f"Consent text mismatch in {page}: expected exactly one label with {text!r}, got {parser.labels!r}")
        print(f"PASS consent wording matches the recorded text: {page}")


if __name__ == "__main__":
    check(Path(__file__).resolve().parents[2])
