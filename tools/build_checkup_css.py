"""개발 화면 결과지 디자인 → css/checkup-result.css

개발 서버의 결과지 스타일(checkup.css, Vite가 JS 모듈로 내려준 것)과 그 바탕이 되는
아이보리 퍼블리싱 report.css의 .cku-* 규칙을 합쳐, 우리 설문 결과 화면에 그대로 쓴다.
설문 진행 화면용 규칙(.sv__*)은 우리 것과 겹치므로 뺀다. 색 토큰은 .checkup 안에서만 정의해
사이트 나머지에 번지지 않게 한다.

  python tools/build_checkup_css.py <checkup_module.js 경로>
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IVORY = ROOT.parent / "publish_ivory" / "css" / "report.css"
OUT = ROOT / "css" / "checkup-result.css"

TOKENS = """.checkup{
  --ink:#2B2724; --orange:#C46A3A; --orange-600:#A8521F; --orange-100:#F3E4D8;
  --stone:#ECE7E0; --porcelain:#FDFCFA; --sage:#9C948B;
  --n-50:#F7F4F0; --n-100:#EDE8E2; --n-200:#E5DFD8; --n-300:#CFC7BE; --n-400:#A79E96;
  --n-500:#7D746B; --n-600:#5F5852; --n-700:#4E4843; --n-800:#3A3531; --n-900:#2B2724;
  --display:var(--f-kr); --en:var(--f-ui);
  font-family:var(--f-kr); color:var(--ink);
}
"""


def strip_comments(css):
    return re.sub(r"/\*.*?\*/", "", css, flags=re.S)


def drop_rules(css, pred):
    """중첩 없는 규칙 블록 중 선택자가 pred를 만족하는 것을 지운다. 빈 @media도 정리."""
    css = re.sub(r"([^{}]+)\{([^{}]*)\}", lambda m: "" if pred(m.group(1).strip()) else m.group(0), css)
    css = re.sub(r"@media[^{]+\{\s*\}", "", css)
    return css


def main(module_path):
    js = Path(module_path).read_text(encoding="utf-8")
    m = re.search(r'const __vite__css = ("(?:[^"\\]|\\.)*")', js)
    dev = json.loads(m.group(1))
    dev = strip_comments(dev)
    dev = drop_rules(dev, lambda s: "sv__" in s or s == ".checkup" or s.startswith("body"))

    ivory = strip_comments(IVORY.read_text(encoding="utf-8"))
    # 아이보리 report.css에서 결과지(.cku-*) 규칙만 가져와 .checkup 안으로 묶는다
    rules = []
    for sel, body in re.findall(r"([^{}@]+)\{([^{}]*)\}", ivory):
        sel = sel.strip()
        if ".cku-" in sel:
            scoped = ", ".join(".checkup " + s.strip() for s in sel.split(","))
            rules.append(f"{scoped}{{{body.strip()}}}")

    out = ("/* 자동 생성 — tools/build_checkup_css.py (개발 화면 checkup.css + 아이보리 report.css). 직접 고치지 말 것.\n"
           "   우리 쪽 보정은 css/report.css 끝에 둔다. */\n"
           + TOKENS + "\n/* 아이보리 report.css (.cku-*) */\n" + "\n".join(rules)
           + "\n\n/* 개발 화면 checkup.css */\n" + re.sub(r"\n{3,}", "\n\n", dev.strip()) + "\n")
    OUT.write_text(out, encoding="utf-8")
    print("wrote", OUT, len(out), "chars,", len(rules), "ivory rules")


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
